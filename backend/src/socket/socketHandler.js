import jwt from 'jsonwebtoken';
import { Connection } from '../models/Connection.js';
import { Message } from '../models/Message.js';
import { Notification } from '../models/Notification.js';

export const setupSocketHandlers = (io) => {
  const onlineUsers = new Map(); // userId -> Set of socket IDs

  io.use((socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.query.token;
    if (!token) return next(new Error('Authentication token required'));

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'planmate_super_secret_jwt_key_2025_genz');
      socket.user = decoded;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user.id;

    if (!onlineUsers.has(userId)) {
      onlineUsers.set(userId, new Set());
    }
    onlineUsers.get(userId).add(socket.id);

    // Join personal notification channel
    socket.join(`user_${userId}`);
    io.emit('online_users', Array.from(onlineUsers.keys()));

    // Join connection room
    socket.on('join_connection', async ({ connectionId }) => {
      const connection = await Connection.findById(connectionId);
      if (connection && connection.users.includes(userId)) {
        socket.join(`connection_${connectionId}`);
      }
    });

    socket.on('leave_connection', ({ connectionId }) => {
      socket.leave(`connection_${connectionId}`);
    });

    // Typing Indicators
    socket.on('typing_start', ({ connectionId, name }) => {
      socket.to(`connection_${connectionId}`).emit('user_typing', {
        connectionId,
        userId,
        name,
        isTyping: true,
      });
    });

    socket.on('typing_stop', ({ connectionId }) => {
      socket.to(`connection_${connectionId}`).emit('user_typing', {
        connectionId,
        userId,
        isTyping: false,
      });
    });

    // Real-time message sending
    socket.on('send_message', async ({ connectionId, content, imageUrl }) => {
      try {
        const connection = await Connection.findById(connectionId);
        if (!connection || !connection.users.includes(userId) || connection.status === 'blocked') {
          return;
        }

        const receiverId = connection.users.find((u) => u.toString() !== userId);
        const message = await Message.create({
          connection: connectionId,
          sender: userId,
          receiver: receiverId,
          content,
          imageUrl,
        });

        connection.lastMessageAt = new Date();
        await connection.save();

        const populatedMsg = await Message.findById(message._id).populate('sender', 'name avatar');

        io.to(`connection_${connectionId}`).emit('new_message', populatedMsg);

        // Notify receiver
        const notif = await Notification.create({
          recipient: receiverId,
          sender: userId,
          type: 'new_message',
          title: 'New Message',
          message: content || '📷 Sent an image',
          data: { connectionId, senderId: userId },
        });

        io.to(`user_${receiverId}`).emit('new_notification', notif);
      } catch (err) {
        console.error('[Socket Message Error]', err);
      }
    });

    // Disconnect
    socket.on('disconnect', () => {
      const userSockets = onlineUsers.get(userId);
      if (userSockets) {
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          onlineUsers.delete(userId);
        }
      }
      io.emit('online_users', Array.from(onlineUsers.keys()));
    });
  });
};
