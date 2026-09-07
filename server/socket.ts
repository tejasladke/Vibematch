import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { db } from './db.js';
import { Message, User } from './types.js';

const JWT_SECRET = process.env.JWT_SECRET || 'planmate_jwt_super_secret_genz_key_2025';

let io: SocketIOServer | null = null;

// Track active socket connections: userId -> Set of socket IDs
const userSocketsMap = new Map<string, Set<string>>();
// Track socketId -> userId
const socketUserMap = new Map<string, string>();

export function initSocketServer(httpServer: HttpServer): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  // Socket Authentication Middleware
  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.query.token;
    if (!token || typeof token !== 'string') {
      return next(new Error('Authentication error: Missing token'));
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { id: string; phone: string; name: string };
      socket.data.user = decoded;
      next();
    } catch (err) {
      return next(new Error('Authentication error: Invalid or expired token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const user = socket.data.user as { id: string; phone: string; name: string };
    const userId = user.id;

    console.log(`[Socket] User connected: ${user.name} (${userId}) [Socket ID: ${socket.id}]`);

    // Track user socket
    if (!userSocketsMap.has(userId)) {
      userSocketsMap.set(userId, new Set());
    }
    userSocketsMap.get(userId)!.add(socket.id);
    socketUserMap.set(socket.id, userId);

    // Join personal notification room
    socket.join(`user_${userId}`);

    // Broadcast user online status
    broadcastOnlineUsers();

    // 1. Join Private Connection Chat Room (Strictly Authorized)
    socket.on('join_connection', ({ connectionId }: { connectionId: string }) => {
      const connection = db.connections.get(connectionId);
      if (!connection) {
        socket.emit('error', { message: 'Connection not found' });
        return;
      }

      // Mandatory authorization check: Must be a member of this connection
      if (!connection.userIds.includes(userId)) {
        socket.emit('error', { message: 'Unauthorized to join this private room' });
        return;
      }

      socket.join(`connection_${connectionId}`);
      console.log(`[Socket] User ${user.name} joined room: connection_${connectionId}`);
    });

    // 2. Leave Connection Chat Room
    socket.on('leave_connection', ({ connectionId }: { connectionId: string }) => {
      socket.leave(`connection_${connectionId}`);
      console.log(`[Socket] User ${user.name} left room: connection_${connectionId}`);
    });

    // 3. Typing Indicators
    socket.on('typing_start', ({ connectionId }: { connectionId: string }) => {
      const connection = db.connections.get(connectionId);
      if (connection && connection.userIds.includes(userId)) {
        socket.to(`connection_${connectionId}`).emit('user_typing', {
          connectionId,
          userId,
          name: user.name,
          isTyping: true,
        });
      }
    });

    socket.on('typing_stop', ({ connectionId }: { connectionId: string }) => {
      const connection = db.connections.get(connectionId);
      if (connection && connection.userIds.includes(userId)) {
        socket.to(`connection_${connectionId}`).emit('user_typing', {
          connectionId,
          userId,
          name: user.name,
          isTyping: false,
        });
      }
    });

    // 4. Send Message via Socket (Strictly Authorized)
    socket.on(
      'send_message',
      async ({
        connectionId,
        content,
        imageUrl,
      }: {
        connectionId: string;
        content?: string;
        imageUrl?: string;
      }) => {
        const connection = db.connections.get(connectionId);
        if (!connection || !connection.userIds.includes(userId)) {
          socket.emit('error', { message: 'Unauthorized connection or chat blocked' });
          return;
        }

        if (connection.status === 'blocked') {
          socket.emit('error', { message: 'This conversation has been blocked' });
          return;
        }

        const receiverId = connection.userIds.find((id) => id !== userId)!;
        const messageId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        const senderUser = db.users.get(userId);
        let safeSender: User | undefined;
        if (senderUser) {
          const { passwordHash, ...safe } = senderUser;
          safeSender = safe as User;
        }

        const newMessage: Message = {
          id: messageId,
          connectionId,
          senderId: userId,
          sender: safeSender,
          receiverId,
          content: (content || '').trim(),
          imageUrl,
          isRead: false,
          createdAt: new Date().toISOString(),
        };

        db.messages.set(messageId, newMessage);
        connection.lastMessage = newMessage;
        connection.lastMessageAt = newMessage.createdAt;
        db.connections.set(connectionId, connection);

        // Broadcast to connection room
        io?.to(`connection_${connectionId}`).emit('new_message', newMessage);

        // Also emit notification to receiver personal room
        const notifId = `notif_${Date.now()}`;
        const notification = {
          id: notifId,
          recipientId: receiverId,
          senderId: userId,
          sender: safeSender,
          type: 'new_message' as const,
          title: `Message from ${user.name}`,
          message: content ? (content.length > 50 ? `${content.substring(0, 47)}...` : content) : '📷 Sent an image',
          data: { connectionId, senderId: userId },
          isRead: false,
          createdAt: new Date().toISOString(),
        };
        db.notifications.set(notifId, notification);
        emitToUser(receiverId, 'new_notification', notification);
      }
    );

    // 5. Mark Messages Read
    socket.on('mark_read', ({ connectionId }: { connectionId: string }) => {
      const connection = db.connections.get(connectionId);
      if (!connection || !connection.userIds.includes(userId)) return;

      const now = new Date().toISOString();
      for (const msg of db.messages.values()) {
        if (msg.connectionId === connectionId && msg.receiverId === userId && !msg.isRead) {
          msg.isRead = true;
          msg.readAt = now;
          db.messages.set(msg.id, msg);
        }
      }

      const otherUserId = connection.userIds.find((id) => id !== userId)!;
      emitToUser(otherUserId, 'messages_read', { connectionId, readBy: userId, readAt: now });
      socket.to(`connection_${connectionId}`).emit('messages_read', { connectionId, readBy: userId, readAt: now });
    });

    // 6. Disconnect Handler
    socket.on('disconnect', () => {
      console.log(`[Socket] User disconnected: ${user.name} (${userId})`);
      const userSockets = userSocketsMap.get(userId);
      if (userSockets) {
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          userSocketsMap.delete(userId);
        }
      }
      socketUserMap.delete(socket.id);
      broadcastOnlineUsers();
    });
  });

  return io;
}

/**
 * Emit event to a specific user by userId across all their open tabs/devices
 */
export function emitToUser(userId: string, event: string, data: unknown): void {
  if (!io) return;
  io.to(`user_${userId}`).emit(event, data);
}

/**
 * Emit event to all users inside a connection room
 */
export function emitToRoom(connectionId: string, event: string, data: unknown): void {
  if (!io) return;
  io.to(`connection_${connectionId}`).emit(event, data);
}

/**
 * Broadcast current online user IDs to all connected clients
 */
function broadcastOnlineUsers(): void {
  if (!io) return;
  const onlineUserIds = Array.from(userSocketsMap.keys());
  io.emit('online_users', onlineUserIds);
}
