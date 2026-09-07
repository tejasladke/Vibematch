import { Response } from 'express';
import { db } from '../db.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { Plan, PlanCategory, TravelPreference, User } from '../types.js';

export class PlanController {
  /**
   * Discover / Browse Plans with filtering & search
   */
  public static async getPlans(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { search, category, location, date, timeFrame, status } = req.query;

      let plans = Array.from(db.plans.values());

      // Filter by status (default to open)
      if (status && status !== 'all') {
        plans = plans.filter((p) => p.status === status);
      } else if (!status) {
        plans = plans.filter((p) => p.status === 'open' || p.status === 'full');
      }

      // Filter by category
      if (category && category !== 'All') {
        plans = plans.filter((p) => p.category.toLowerCase() === String(category).toLowerCase());
      }

      // Filter by location
      if (location && String(location).trim()) {
        const locLower = String(location).toLowerCase().trim();
        plans = plans.filter((p) => p.location.toLowerCase().includes(locLower));
      }

      // Filter by search query
      if (search && String(search).trim()) {
        const q = String(search).toLowerCase().trim();
        plans = plans.filter(
          (p) =>
            p.title.toLowerCase().includes(q) ||
            p.description.toLowerCase().includes(q) ||
            p.location.toLowerCase().includes(q) ||
            p.category.toLowerCase().includes(q)
        );
      }

      // Filter by date / timeFrame
      const todayStr = new Date().toISOString().split('T')[0];
      if (date && String(date).trim()) {
        plans = plans.filter((p) => p.date === String(date).trim());
      } else if (timeFrame === 'today') {
        plans = plans.filter((p) => p.date === todayStr);
      } else if (timeFrame === 'upcoming') {
        plans = plans.filter((p) => p.date >= todayStr);
      }

      // Populate creator and members
      const populatedPlans = plans.map((plan) => {
        const creator = db.users.get(plan.creatorId);
        let cleanCreator: User | undefined;
        if (creator) {
          const { passwordHash, ...safeCreator } = creator;
          cleanCreator = safeCreator as User;
        }

        return {
          ...plan,
          creator: cleanCreator,
          remainingSlots: Math.max(0, plan.maxPeople - plan.joinedCount),
        };
      });

      // Sort by newest or earliest upcoming date
      populatedPlans.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      res.json({ success: true, data: populatedPlans, count: populatedPlans.length });
    } catch (error) {
      console.error('[Get Plans Error]', error);
      res.status(500).json({ success: false, error: 'Failed to retrieve plans.' });
    }
  }

  /**
   * Get single Plan details by ID
   */
  public static async getPlanById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const plan = db.plans.get(id);

      if (!plan) {
        res.status(404).json({ success: false, error: 'Plan not found.' });
        return;
      }

      const creator = db.users.get(plan.creatorId);
      let cleanCreator: User | undefined;
      if (creator) {
        const { passwordHash, ...safeCreator } = creator;
        cleanCreator = safeCreator as User;
      }

      // Populate member objects
      const memberUsers: User[] = [];
      if (Array.isArray(plan.members)) {
        for (const member of plan.members) {
          const mId = typeof member === 'string' ? member : member.id;
          const u = db.users.get(mId);
          if (u) {
            const { passwordHash, ...safeMember } = u;
            memberUsers.push(safeMember as User);
          }
        }
      }

      // Check current user's relation to this plan
      let userRelation = {
        isCreator: false,
        isMember: false,
        hasPendingRequest: false,
        joinRequestId: null as string | null,
        connectionId: null as string | null,
      };

      if (req.user) {
        const currentUserId = req.user.id;
        userRelation.isCreator = plan.creatorId === currentUserId;
        userRelation.isMember = memberUsers.some((m) => m.id === currentUserId) || userRelation.isCreator;

        // Check if there is an active join request
        for (const r of db.joinRequests.values()) {
          if (r.planId === plan.id && r.requesterId === currentUserId) {
            if (r.status === 'pending') {
              userRelation.hasPendingRequest = true;
              userRelation.joinRequestId = r.id;
            }
            break;
          }
        }

        // Check if there is a direct connection with the creator
        for (const c of db.connections.values()) {
          if (c.planId === plan.id && c.userIds.includes(currentUserId)) {
            userRelation.connectionId = c.id;
            break;
          }
        }
      }

      res.json({
        success: true,
        data: {
          ...plan,
          creator: cleanCreator,
          members: memberUsers,
          remainingSlots: Math.max(0, plan.maxPeople - plan.joinedCount),
          userRelation,
        },
      });
    } catch (error) {
      console.error('[Get Plan By ID Error]', error);
      res.status(500).json({ success: false, error: 'Failed to retrieve plan details.' });
    }
  }

  /**
   * Create a new Activity Plan
   */
  public static async createPlan(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Authentication required.' });
        return;
      }

      const {
        title,
        category,
        date,
        time,
        location,
        maxPeople,
        budget,
        description,
        travelPreference,
        image,
      } = req.body;

      if (!title || !title.trim()) {
        res.status(400).json({ success: false, error: 'Activity title is required.' });
        return;
      }

      if (!category) {
        res.status(400).json({ success: false, error: 'Category is required.' });
        return;
      }

      if (!date || !time) {
        res.status(400).json({ success: false, error: 'Date and time are required.' });
        return;
      }

      if (!location || !location.trim()) {
        res.status(400).json({ success: false, error: 'Location / Venue is required.' });
        return;
      }

      const parsedMaxPeople = parseInt(maxPeople, 10);
      if (isNaN(parsedMaxPeople) || parsedMaxPeople < 2) {
        res.status(400).json({ success: false, error: 'Maximum people must be at least 2.' });
        return;
      }

      const planId = `plan_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const newPlan: Plan = {
        id: planId,
        title: title.trim(),
        category: category as PlanCategory,
        date: date.trim(),
        time: time.trim(),
        location: location.trim(),
        maxPeople: parsedMaxPeople,
        joinedCount: 1, // Creator counts as 1st member
        budget: (budget || 'Split evenly').trim(),
        description: (description || '').trim(),
        travelPreference: (travelPreference || 'Flexible') as TravelPreference,
        image: image || 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=800&q=80',
        creatorId: req.user.id,
        members: [req.user.id],
        status: 'open',
        createdAt: new Date().toISOString(),
      };

      db.plans.set(planId, newPlan);

      res.status(201).json({
        success: true,
        message: 'Activity plan published successfully! 🚀',
        data: newPlan,
      });
    } catch (error) {
      console.error('[Create Plan Error]', error);
      res.status(500).json({ success: false, error: 'Failed to create plan.' });
    }
  }

  /**
   * Update an existing Plan (Creator only)
   */
  public static async updatePlan(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Authentication required.' });
        return;
      }

      const { id } = req.params;
      const plan = db.plans.get(id);

      if (!plan) {
        res.status(404).json({ success: false, error: 'Plan not found.' });
        return;
      }

      if (plan.creatorId !== req.user.id) {
        res.status(403).json({ success: false, error: 'Only the plan creator can modify this activity.' });
        return;
      }

      const updates = req.body;
      const updatedPlan: Plan = {
        ...plan,
        title: updates.title !== undefined ? updates.title.trim() : plan.title,
        category: updates.category !== undefined ? updates.category : plan.category,
        date: updates.date !== undefined ? updates.date.trim() : plan.date,
        time: updates.time !== undefined ? updates.time.trim() : plan.time,
        location: updates.location !== undefined ? updates.location.trim() : plan.location,
        maxPeople: updates.maxPeople !== undefined ? parseInt(updates.maxPeople, 10) : plan.maxPeople,
        budget: updates.budget !== undefined ? updates.budget.trim() : plan.budget,
        description: updates.description !== undefined ? updates.description.trim() : plan.description,
        travelPreference: updates.travelPreference !== undefined ? updates.travelPreference : plan.travelPreference,
        image: updates.image !== undefined ? updates.image : plan.image,
        status: updates.status !== undefined ? updates.status : plan.status,
        updatedAt: new Date().toISOString(),
      };

      // Recalculate status if maxPeople adjusted
      if (updatedPlan.joinedCount >= updatedPlan.maxPeople && updatedPlan.status === 'open') {
        updatedPlan.status = 'full';
      } else if (updatedPlan.joinedCount < updatedPlan.maxPeople && updatedPlan.status === 'full') {
        updatedPlan.status = 'open';
      }

      db.plans.set(id, updatedPlan);

      res.json({
        success: true,
        message: 'Plan updated successfully.',
        data: updatedPlan,
      });
    } catch (error) {
      console.error('[Update Plan Error]', error);
      res.status(500).json({ success: false, error: 'Failed to update plan.' });
    }
  }

  /**
   * Cancel or Delete Plan (Creator only)
   */
  public static async deletePlan(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Authentication required.' });
        return;
      }

      const { id } = req.params;
      const plan = db.plans.get(id);

      if (!plan) {
        res.status(404).json({ success: false, error: 'Plan not found.' });
        return;
      }

      if (plan.creatorId !== req.user.id) {
        res.status(403).json({ success: false, error: 'Only the creator can cancel this plan.' });
        return;
      }

      plan.status = 'cancelled';
      plan.updatedAt = new Date().toISOString();
      db.plans.set(id, plan);

      res.json({ success: true, message: 'Plan has been cancelled.' });
    } catch (error) {
      console.error('[Delete Plan Error]', error);
      res.status(500).json({ success: false, error: 'Failed to cancel plan.' });
    }
  }

  /**
   * Get Plans Created by Me
   */
  public static async getMyCreatedPlans(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Authentication required.' });
        return;
      }

      const myPlans = Array.from(db.plans.values())
        .filter((p) => p.creatorId === req.user!.id)
        .map((p) => {
          // Count pending requests for this plan
          const pendingCount = Array.from(db.joinRequests.values()).filter(
            (r) => r.planId === p.id && r.status === 'pending'
          ).length;

          return {
            ...p,
            pendingRequestsCount: pendingCount,
            remainingSlots: Math.max(0, p.maxPeople - p.joinedCount),
          };
        })
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      res.json({ success: true, data: myPlans });
    } catch (error) {
      console.error('[Get My Plans Error]', error);
      res.status(500).json({ success: false, error: 'Failed to retrieve your created plans.' });
    }
  }

  /**
   * Get Plans I've Joined (Member or accepted request)
   */
  public static async getMyJoinedPlans(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Authentication required.' });
        return;
      }

      const currentUserId = req.user.id;
      const joinedPlans = Array.from(db.plans.values())
        .filter((p) => {
          if (p.creatorId === currentUserId) return false; // creator plans are in created tab
          if (Array.isArray(p.members) && p.members.some((m) => (typeof m === 'string' ? m : m.id) === currentUserId)) {
            return true;
          }
          return false;
        })
        .map((p) => {
          const creator = db.users.get(p.creatorId);
          let cleanCreator: User | undefined;
          if (creator) {
            const { passwordHash, ...safe } = creator;
            cleanCreator = safe as User;
          }
          return { ...p, creator: cleanCreator };
        });

      res.json({ success: true, data: joinedPlans });
    } catch (error) {
      console.error('[Get My Joined Plans Error]', error);
      res.status(500).json({ success: false, error: 'Failed to retrieve joined plans.' });
    }
  }
}
