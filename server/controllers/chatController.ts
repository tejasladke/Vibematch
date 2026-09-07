import { Response } from 'express';
import { db } from '../db.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { Message, Notification, User } from '../types.js';
import { emitToRoom, emitToUser } from '../socket.js';

export class ChatController {
  /**
   * Get Message History for a Connection (Strictly Authorized)
   */
  public static async getMessages(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Authentication required.' });
        return;
      }

      const { connectionId } = req.params;
      const connection = db.connections.get(connectionId);

      if (!connection) {
        res.status(404).json({ success: false, error: 'Connection not found.' });
        return;
      }

      // 1. Mandatory verification: current user MUST belong to this connection
      if (!connection.userIds.includes(req.user.id)) {
        res.status(403).json({ success: false, error: 'Unauthorized to view messages for this connection.' });
        return;
      }

      const messages = Array.from(db.messages.values())
        .filter((m) => m.connectionId === connectionId)
        .map((m) => {
          const sender = db.users.get(m.senderId);
          let safeSender: User | undefined;
          if (sender) {
            const { passwordHash, ...safe } = sender;
            safeSender = safe as User;
          }
          return { ...m, sender: safeSender };
        })
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

      res.json({ success: true, data: messages });
    } catch (error) {
      console.error('[Get Messages Error]', error);
      res.status(500).json({ success: false, error: 'Failed to retrieve messages.' });
    }
  }

  /**
   * Send a Private Message (Strictly Authorized)
   */
  public static async sendMessage(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Authentication required.' });
        return;
      }

      const { connectionId } = req.params;
      const { content, imageUrl } = req.body;

      if (!content && !imageUrl) {
        res.status(400).json({ success: false, error: 'Message content or image is required.' });
        return;
      }

      const connection = db.connections.get(connectionId);
      if (!connection) {
        res.status(404).json({ success: false, error: 'Connection not found.' });
        return;
      }

      // 1. Mandatory verification: current user MUST belong to this connection
      if (!connection.userIds.includes(req.user.id)) {
        res.status(403).json({ success: false, error: 'Unauthorized to send messages in this connection.' });
        return;
      }

      // 2. Check if blocked
      if (connection.status === 'blocked') {
        res.status(403).json({ success: false, error: 'Cannot send messages to a blocked connection.' });
        return;
      }

      const senderId = req.user.id;
      const receiverId = connection.userIds.find((id) => id !== senderId)!;

      const messageId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const senderUser = db.users.get(senderId);
      let safeSender: User | undefined;
      if (senderUser) {
        const { passwordHash, ...safe } = senderUser;
        safeSender = safe as User;
      }

      const newMessage: Message = {
        id: messageId,
        connectionId,
        senderId,
        sender: safeSender,
        receiverId,
        content: (content || '').trim(),
        imageUrl: imageUrl || undefined,
        isRead: false,
        createdAt: new Date().toISOString(),
      };

      db.messages.set(messageId, newMessage);

      // Update connection's lastMessage & lastMessageAt
      connection.lastMessage = newMessage;
      connection.lastMessageAt = newMessage.createdAt;
      db.connections.set(connectionId, connection);

      // Create notification for receiver
      const notifId = `notif_${Date.now()}`;
      const notification: Notification = {
        id: notifId,
        recipientId: receiverId,
        senderId,
        sender: safeSender,
        type: 'new_message',
        title: `Message from ${req.user.name}`,
        message: content ? (content.length > 50 ? `${content.substring(0, 47)}...` : content) : '📷 Sent an image',
        data: { connectionId, senderId },
        isRead: false,
        createdAt: new Date().toISOString(),
      };
      db.notifications.set(notifId, notification);

      // Real-time broadcasts
      emitToRoom(connectionId, 'new_message', newMessage);
      emitToUser(receiverId, 'new_notification', notification);

      res.status(201).json({ success: true, data: newMessage });
    } catch (error) {
      console.error('[Send Message Error]', error);
      res.status(500).json({ success: false, error: 'Failed to send message.' });
    }
  }

  /**
   * Mark all unread messages in a connection as read
   */
  public static async markAsRead(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Authentication required.' });
        return;
      }

      const { connectionId } = req.params;
      const connection = db.connections.get(connectionId);

      if (!connection || !connection.userIds.includes(req.user.id)) {
        res.status(404).json({ success: false, error: 'Connection not found.' });
        return;
      }

      const currentUserId = req.user.id;
      const now = new Date().toISOString();
      let updatedCount = 0;

      for (const msg of db.messages.values()) {
        if (msg.connectionId === connectionId && msg.receiverId === currentUserId && !msg.isRead) {
          msg.isRead = true;
          msg.readAt = now;
          db.messages.set(msg.id, msg);
          updatedCount++;
        }
      }

      // Notify the other user in real-time that their messages were read
      const otherUserId = connection.userIds.find((id) => id !== currentUserId)!;
      emitToUser(otherUserId, 'messages_read', { connectionId, readBy: currentUserId, readAt: now });

      res.json({ success: true, updatedCount });
    } catch (error) {
      console.error('[Mark Read Error]', error);
      res.status(500).json({ success: false, error: 'Failed to mark messages as read.' });
    }
  }
}
