import { Response } from 'express';
import { db, ReportRecord } from '../db.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { Connection, Message, User } from '../types.js';

export class ConnectionController {
  /**
   * Get all active connections for current user
   */
  public static async getMyConnections(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Authentication required.' });
        return;
      }

      const currentUserId = req.user.id;
      const connections = Array.from(db.connections.values())
        .filter((c) => c.userIds.includes(currentUserId))
        .map((c) => {
          const userA = db.users.get(c.userIds[0]);
          const userB = db.users.get(c.userIds[1]);

          const safeUserA: User | undefined = userA ? (({ passwordHash, ...safe }) => safe as User)(userA) : undefined;
          const safeUserB: User | undefined = userB ? (({ passwordHash, ...safe }) => safe as User)(userB) : undefined;

          // Count unread messages for current user in this connection
          const unreadCount = Array.from(db.messages.values()).filter(
            (m) => m.connectionId === c.id && m.receiverId === currentUserId && !m.isRead
          ).length;

          const plan = db.plans.get(c.planId);

          return {
            ...c,
            users: [safeUserA!, safeUserB!] as [User, User],
            unreadCount,
            plan,
          };
        })
        .sort((a, b) => {
          const timeA = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : new Date(a.createdAt).getTime();
          const timeB = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : new Date(b.createdAt).getTime();
          return timeB - timeA;
        });

      res.json({ success: true, data: connections });
    } catch (error) {
      console.error('[Get Connections Error]', error);
      res.status(500).json({ success: false, error: 'Failed to retrieve connections.' });
    }
  }

  /**
   * Get single connection details by ID (with authorization check)
   */
  public static async getConnectionById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Authentication required.' });
        return;
      }

      const { id } = req.params;
      const connection = db.connections.get(id);

      if (!connection) {
        res.status(404).json({ success: false, error: 'Connection not found.' });
        return;
      }

      // Mandatory authorization check: current user MUST belong to this connection
      if (!connection.userIds.includes(req.user.id)) {
        res.status(403).json({ success: false, error: 'Unauthorized to access this private chat connection.' });
        return;
      }

      const userA = db.users.get(connection.userIds[0]);
      const userB = db.users.get(connection.userIds[1]);
      const safeUserA: User | undefined = userA ? (({ passwordHash, ...safe }) => safe as User)(userA) : undefined;
      const safeUserB: User | undefined = userB ? (({ passwordHash, ...safe }) => safe as User)(userB) : undefined;
      const plan = db.plans.get(connection.planId);

      res.json({
        success: true,
        data: {
          ...connection,
          users: [safeUserA!, safeUserB!] as [User, User],
          plan,
        },
      });
    } catch (error) {
      console.error('[Get Connection By ID Error]', error);
      res.status(500).json({ success: false, error: 'Failed to retrieve connection details.' });
    }
  }

  /**
   * Block or unblock a connection
   */
  public static async toggleBlockConnection(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Authentication required.' });
        return;
      }

      const { id } = req.params;
      const connection = db.connections.get(id);

      if (!connection || !connection.userIds.includes(req.user.id)) {
        res.status(404).json({ success: false, error: 'Connection not found.' });
        return;
      }

      const otherUserId = connection.userIds.find((uid) => uid !== req.user!.id)!;
      const currentUser = db.users.get(req.user.id);

      if (connection.status === 'blocked') {
        connection.status = 'active';
        connection.blockedBy = undefined;
        if (currentUser && currentUser.blockedUsers) {
          currentUser.blockedUsers = currentUser.blockedUsers.filter((uid) => uid !== otherUserId);
        }
      } else {
        connection.status = 'blocked';
        connection.blockedBy = req.user.id;
        if (currentUser) {
          if (!currentUser.blockedUsers) currentUser.blockedUsers = [];
          if (!currentUser.blockedUsers.includes(otherUserId)) {
            currentUser.blockedUsers.push(otherUserId);
          }
        }
      }

      db.connections.set(id, connection);
      if (currentUser) db.users.set(currentUser.id, currentUser);

      res.json({
        success: true,
        message: connection.status === 'blocked' ? 'User blocked successfully.' : 'User unblocked successfully.',
        data: connection,
      });
    } catch (error) {
      console.error('[Toggle Block Error]', error);
      res.status(500).json({ success: false, error: 'Failed to update block status.' });
    }
  }

  /**
   * Report a user for safety/moderation
   */
  public static async reportUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Authentication required.' });
        return;
      }

      const { reportedUserId, reason, details } = req.body;
      if (!reportedUserId || !reason) {
        res.status(400).json({ success: false, error: 'Reported user ID and reason are required.' });
        return;
      }

      const reportId = `rep_${Date.now()}`;
      const report: ReportRecord = {
        id: reportId,
        reporterId: req.user.id,
        reportedUserId,
        reason,
        details: (details || '').trim(),
        createdAt: new Date().toISOString(),
      };

      db.reports.set(reportId, report);

      res.json({
        success: true,
        message: 'Thank you for reporting. Our safety team will review this promptly.',
      });
    } catch (error) {
      console.error('[Report User Error]', error);
      res.status(500).json({ success: false, error: 'Failed to submit report.' });
    }
  }
}
