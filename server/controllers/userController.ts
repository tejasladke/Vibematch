import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { Plan, User } from '../types.js';

export class UserController {
  /**
   * Get user profile by ID with created & joined plans
   */
  public static async getUserProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const user = db.users.get(id);

      if (!user) {
        res.status(404).json({ success: false, error: 'User not found.' });
        return;
      }

      const { passwordHash, ...safeUser } = user;

      // Get plans created by this user
      const createdPlans = Array.from(db.plans.values())
        .filter((p) => p.creatorId === id && p.status !== 'cancelled')
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      // Get plans joined by this user
      const joinedPlans = Array.from(db.plans.values())
        .filter((p) => {
          if (p.creatorId === id) return false;
          return Array.isArray(p.members) && p.members.some((m) => (typeof m === 'string' ? m : m.id) === id);
        })
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      res.json({
        success: true,
        data: {
          user: safeUser,
          createdPlans,
          joinedPlans,
          stats: {
            createdCount: createdPlans.length,
            joinedCount: joinedPlans.length,
          },
        },
      });
    } catch (error) {
      console.error('[Get User Profile Error]', error);
      res.status(500).json({ success: false, error: 'Failed to retrieve profile.' });
    }
  }

  /**
   * Update current user's profile
   */
  public static async updateProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Authentication required.' });
        return;
      }

      const user = db.users.get(req.user.id);
      if (!user) {
        res.status(404).json({ success: false, error: 'User not found.' });
        return;
      }

      const { name, avatar, age, bio, interests, location, socialLinks } = req.body;

      if (name && name.trim()) user.name = name.trim();
      if (avatar) user.avatar = avatar;
      if (age !== undefined) user.age = parseInt(age, 10);
      if (bio !== undefined) user.bio = bio.trim();
      if (Array.isArray(interests)) user.interests = interests;
      if (location !== undefined) user.location = location.trim();
      if (socialLinks) user.socialLinks = { ...user.socialLinks, ...socialLinks };

      db.users.set(user.id, user);

      const { passwordHash, ...safeUser } = user;
      res.json({
        success: true,
        message: 'Profile updated successfully! ✨',
        data: safeUser,
      });
    } catch (error) {
      console.error('[Update Profile Error]', error);
      res.status(500).json({ success: false, error: 'Failed to update profile.' });
    }
  }

  /**
   * Change current user's password
   */
  public static async changePassword(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Authentication required.' });
        return;
      }

      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        res.status(400).json({ success: false, error: 'Current password and new password are required.' });
        return;
      }

      if (newPassword.length < 6) {
        res.status(400).json({ success: false, error: 'New password must be at least 6 characters long.' });
        return;
      }

      const user = db.users.get(req.user.id);
      if (!user) {
        res.status(404).json({ success: false, error: 'User not found.' });
        return;
      }

      const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isMatch) {
        res.status(400).json({ success: false, error: 'Current password does not match.' });
        return;
      }

      const salt = await bcrypt.genSalt(10);
      user.passwordHash = await bcrypt.hash(newPassword, salt);
      db.users.set(user.id, user);

      res.json({ success: true, message: 'Password changed successfully.' });
    } catch (error) {
      console.error('[Change Password Error]', error);
      res.status(500).json({ success: false, error: 'Failed to update password.' });
    }
  }

  /**
   * Update notification preferences
   */
  public static async updateNotificationPreferences(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Authentication required.' });
        return;
      }

      const user = db.users.get(req.user.id);
      if (!user) {
        res.status(404).json({ success: false, error: 'User not found.' });
        return;
      }

      const { preferences } = req.body;
      if (preferences) {
        user.notificationPreferences = {
          ...user.notificationPreferences,
          ...preferences,
        };
        db.users.set(user.id, user);
      }

      res.json({
        success: true,
        message: 'Notification preferences saved.',
        data: user.notificationPreferences,
      });
    } catch (error) {
      console.error('[Update Preferences Error]', error);
      res.status(500).json({ success: false, error: 'Failed to update preferences.' });
    }
  }
}
