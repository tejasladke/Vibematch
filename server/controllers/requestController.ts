import { Response } from 'express';
import { db } from '../db.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { Connection, JoinRequest, Notification, User } from '../types.js';
import { emitToUser } from '../socket.js';

export class RequestController {
  /**
   * User requests to join an activity plan
   */
  public static async createJoinRequest(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Authentication required to join plans.' });
        return;
      }

      const { planId, message } = req.body;
      if (!planId) {
        res.status(400).json({ success: false, error: 'Plan ID is required.' });
        return;
      }

      const plan = db.plans.get(planId);
      if (!plan) {
        res.status(404).json({ success: false, error: 'Activity plan not found.' });
        return;
      }

      // 1. Validate plan is open
      if (plan.status !== 'open') {
        res.status(400).json({
          success: false,
          error: plan.status === 'full' ? 'This plan is already full.' : 'This plan is no longer open.',
        });
        return;
      }

      // 2. Prevent creator from joining their own plan
      if (plan.creatorId === req.user.id) {
        res.status(400).json({ success: false, error: 'You are the creator of this activity plan.' });
        return;
      }

      // 3. Prevent duplicate requests (pending or already accepted)
      for (const r of db.joinRequests.values()) {
        if (r.planId === planId && r.requesterId === req.user.id) {
          if (r.status === 'pending') {
            res.status(400).json({ success: false, error: 'You already have a pending join request for this plan.' });
            return;
          }
          if (r.status === 'accepted') {
            res.status(400).json({ success: false, error: 'You are already an accepted member of this plan.' });
            return;
          }
        }
      }

      // 4. Prevent joining when plan is full
      if (plan.joinedCount >= plan.maxPeople) {
        plan.status = 'full';
        db.plans.set(plan.id, plan);
        res.status(400).json({ success: false, error: 'This plan is already at maximum capacity.' });
        return;
      }

      // 5. Create JoinRequest
      const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const requester = db.users.get(req.user.id);
      let cleanRequester: User | undefined;
      if (requester) {
        const { passwordHash, ...safe } = requester;
        cleanRequester = safe as User;
      }

      const newRequest: JoinRequest = {
        id: requestId,
        planId: plan.id,
        plan,
        requesterId: req.user.id,
        requester: cleanRequester,
        creatorId: plan.creatorId,
        status: 'pending',
        message: (message || '').trim(),
        createdAt: new Date().toISOString(),
      };

      db.joinRequests.set(requestId, newRequest);

      // 6. Notify Creator
      const notifId = `notif_${Date.now()}`;
      const notification: Notification = {
        id: notifId,
        recipientId: plan.creatorId,
        senderId: req.user.id,
        sender: cleanRequester,
        type: 'join_request_received',
        title: 'New Join Request!',
        message: `${req.user.name} requested to join "${plan.title}"`,
        data: { planId: plan.id, requestId: newRequest.id, senderId: req.user.id },
        isRead: false,
        createdAt: new Date().toISOString(),
      };
      db.notifications.set(notifId, notification);

      // Real-time socket alert to creator
      emitToUser(plan.creatorId, 'new_notification', notification);
      emitToUser(plan.creatorId, 'join_request_received', newRequest);

      res.status(201).json({
        success: true,
        message: 'Join request submitted! The creator has been notified.',
        data: newRequest,
      });
    } catch (error) {
      console.error('[Create Join Request Error]', error);
      res.status(500).json({ success: false, error: 'Failed to submit join request.' });
    }
  }

  /**
   * Get all incoming join requests for plans I created
   */
  public static async getIncomingRequests(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Authentication required.' });
        return;
      }

      const requests = Array.from(db.joinRequests.values())
        .filter((r) => r.creatorId === req.user!.id)
        .map((r) => {
          const requester = db.users.get(r.requesterId);
          let safeRequester: User | undefined;
          if (requester) {
            const { passwordHash, ...safe } = requester;
            safeRequester = safe as User;
          }
          const plan = db.plans.get(r.planId);
          return {
            ...r,
            requester: safeRequester,
            plan,
          };
        })
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      res.json({ success: true, data: requests });
    } catch (error) {
      console.error('[Get Incoming Requests Error]', error);
      res.status(500).json({ success: false, error: 'Failed to retrieve incoming requests.' });
    }
  }

  /**
   * Get all outgoing join requests sent by current user
   */
  public static async getMySentRequests(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Authentication required.' });
        return;
      }

      const requests = Array.from(db.joinRequests.values())
        .filter((r) => r.requesterId === req.user!.id)
        .map((r) => {
          const plan = db.plans.get(r.planId);
          const creator = plan ? db.users.get(plan.creatorId) : null;
          let safeCreator: User | undefined;
          if (creator) {
            const { passwordHash, ...safe } = creator;
            safeCreator = safe as User;
          }
          return {
            ...r,
            plan: plan ? { ...plan, creator: safeCreator } : undefined,
          };
        })
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      res.json({ success: true, data: requests });
    } catch (error) {
      console.error('[Get My Sent Requests Error]', error);
      res.status(500).json({ success: false, error: 'Failed to retrieve sent requests.' });
    }
  }

  /**
   * Creator accepts a join request
   * Creates connection & unlocks private chat
   */
  public static async acceptRequest(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Authentication required.' });
        return;
      }

      const { id } = req.params;
      const request = db.joinRequests.get(id);

      if (!request) {
        res.status(404).json({ success: false, error: 'Join request not found.' });
        return;
      }

      const plan = db.plans.get(request.planId);
      if (!plan) {
        res.status(404).json({ success: false, error: 'Associated plan not found.' });
        return;
      }

      if (plan.creatorId !== req.user.id) {
        res.status(403).json({ success: false, error: 'Only the creator can accept requests for this plan.' });
        return;
      }

      if (request.status !== 'pending') {
        res.status(400).json({ success: false, error: `This request is already ${request.status}.` });
        return;
      }

      // Check if plan is already full
      if (plan.joinedCount >= plan.maxPeople) {
        res.status(400).json({ success: false, error: 'Plan is already full.' });
        return;
      }

      // 1. Update request status
      request.status = 'accepted';
      request.updatedAt = new Date().toISOString();
      db.joinRequests.set(id, request);

      // 2. Increase joined count & add member to plan
      plan.joinedCount += 1;
      if (!Array.isArray(plan.members)) {
        plan.members = [plan.creatorId];
      }
      if (!plan.members.some((m) => (typeof m === 'string' ? m : m.id) === request.requesterId)) {
        plan.members.push(request.requesterId);
      }
      if (plan.joinedCount >= plan.maxPeople) {
        plan.status = 'full';
      }
      db.plans.set(plan.id, plan);

      // 3. Create or fetch Connection between creator & requester
      let connection: Connection | null = null;
      for (const c of db.connections.values()) {
        if (
          (c.userIds[0] === req.user.id && c.userIds[1] === request.requesterId) ||
          (c.userIds[1] === req.user.id && c.userIds[0] === request.requesterId)
        ) {
          connection = c;
          break;
        }
      }

      const creatorObj = db.users.get(req.user.id);
      const requesterObj = db.users.get(request.requesterId);
      const { passwordHash: _p1, ...safeCreator } = creatorObj!;
      const { passwordHash: _p2, ...safeRequester } = requesterObj!;

      if (!connection) {
        const connectionId = `conn_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        connection = {
          id: connectionId,
          users: [safeCreator as User, safeRequester as User],
          userIds: [req.user.id, request.requesterId],
          planId: plan.id,
          plan,
          status: 'active',
          unreadCount: 0,
          createdAt: new Date().toISOString(),
        };
        db.connections.set(connectionId, connection);
      }

      // 4. Notify Requester
      const notifId = `notif_${Date.now()}`;
      const notification: Notification = {
        id: notifId,
        recipientId: request.requesterId,
        senderId: req.user.id,
        sender: safeCreator as User,
        type: 'join_request_accepted',
        title: 'Join Request Accepted! 🎉',
        message: `${req.user.name} accepted your request to join "${plan.title}". Private chat is now unlocked!`,
        data: { planId: plan.id, connectionId: connection.id, senderId: req.user.id },
        isRead: false,
        createdAt: new Date().toISOString(),
      };
      db.notifications.set(notifId, notification);

      // Real-time socket alerts
      emitToUser(request.requesterId, 'new_notification', notification);
      emitToUser(request.requesterId, 'join_request_accepted', {
        requestId: request.id,
        planId: plan.id,
        connectionId: connection.id,
      });

      res.json({
        success: true,
        message: 'Request accepted! Squad member added and private chat opened.',
        data: {
          request,
          connectionId: connection.id,
          plan,
        },
      });
    } catch (error) {
      console.error('[Accept Request Error]', error);
      res.status(500).json({ success: false, error: 'Failed to accept request.' });
    }
  }

  /**
   * Creator rejects a join request
   */
  public static async rejectRequest(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Authentication required.' });
        return;
      }

      const { id } = req.params;
      const request = db.joinRequests.get(id);

      if (!request) {
        res.status(404).json({ success: false, error: 'Join request not found.' });
        return;
      }

      const plan = db.plans.get(request.planId);
      if (!plan || plan.creatorId !== req.user.id) {
        res.status(403).json({ success: false, error: 'Only the creator can reject requests.' });
        return;
      }

      request.status = 'rejected';
      request.updatedAt = new Date().toISOString();
      db.joinRequests.set(id, request);

      // Notify Requester
      const notifId = `notif_${Date.now()}`;
      const notification: Notification = {
        id: notifId,
        recipientId: request.requesterId,
        senderId: req.user.id,
        type: 'join_request_rejected',
        title: 'Plan Request Update',
        message: `Your request to join "${plan.title}" was not accepted. Keep exploring other active plans!`,
        data: { planId: plan.id, requestId: request.id },
        isRead: false,
        createdAt: new Date().toISOString(),
      };
      db.notifications.set(notifId, notification);
      emitToUser(request.requesterId, 'new_notification', notification);

      res.json({ success: true, message: 'Request rejected.', data: request });
    } catch (error) {
      console.error('[Reject Request Error]', error);
      res.status(500).json({ success: false, error: 'Failed to reject request.' });
    }
  }
}
