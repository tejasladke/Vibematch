import { Response } from 'express';
import { db } from '../db.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { Notification, User } from '../types.js';

export class NotificationController {
  /**
   * Get all notifications for current user
   */
  public static async getNotifications(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Authentication required.' });
        return;
      }

      const currentUserId = req.user.id;
      const notifications = Array.from(db.notifications.values())
        .filter((n) => n.recipientId === currentUserId)
        .map((n) => {
          let safeSender: User | undefined;
          if (n.senderId) {
            const sender = db.users.get(n.senderId);
            if (sender) {
              const { passwordHash, ...safe } = sender;
              safeSender = safe as User;
            }
          }
          return { ...n, sender: safeSender };
        })
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      const unreadCount = notifications.filter((n) => !n.isRead).length;

      res.json({
        success: true,
        data: notifications,
        unreadCount,
      });
    } catch (error) {
      console.error('[Get Notifications Error]', error);
      res.status(500).json({ success: false, error: 'Failed to retrieve notifications.' });
    }
  }

  /**
   * Mark a single notification as read
   */
  public static async markAsRead(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Authentication required.' });
        return;
      }

      const { id } = req.params;
      const notification = db.notifications.get(id);

      if (!notification || notification.recipientId !== req.user.id) {
        res.status(404).json({ success: false, error: 'Notification not found.' });
        return;
      }

      notification.isRead = true;
      db.notifications.set(id, notification);

      res.json({ success: true, data: notification });
    } catch (error) {
      console.error('[Mark Notification Read Error]', error);
      res.status(500).json({ success: false, error: 'Failed to update notification.' });
    }
  }

  /**
   * Mark all notifications as read
   */
  public static async markAllAsRead(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Authentication required.' });
        return;
      }

      const currentUserId = req.user.id;
      let count = 0;

      for (const notif of db.notifications.values()) {
        if (notif.recipientId === currentUserId && !notif.isRead) {
          notif.isRead = true;
          db.notifications.set(notif.id, notif);
          count++;
        }
      }

      res.json({ success: true, count, message: 'All notifications marked as read.' });
    } catch (error) {
      console.error('[Mark All Read Error]', error);
      res.status(500).json({ success: false, error: 'Failed to mark all as read.' });
    }
  }
}
