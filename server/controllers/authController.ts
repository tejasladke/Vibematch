import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db.js';
import { generateToken, AuthenticatedRequest } from '../middleware/auth.js';
import { User } from '../types.js';

export class AuthController {
  /**
   * Register a new user
   * MANDATE: DO NOT send OTP during registration.
   */
  public static async register(req: Request, res: Response): Promise<void> {
    try {
      const { name, phone, password, age, bio, interests, location, socialLinks, avatar } = req.body;

      if (!name || !name.trim()) {
        res.status(400).json({ success: false, error: 'Full name is required.' });
        return;
      }

      if (!phone || !phone.trim()) {
        res.status(400).json({ success: false, error: 'Phone number is required.' });
        return;
      }

      const cleanPhone = phone.replace(/[^0-9]/g, '');
      if (cleanPhone.length < 10) {
        res.status(400).json({ success: false, error: 'Please enter a valid 10-digit phone number.' });
        return;
      }

      if (!password || password.length < 6) {
        res.status(400).json({ success: false, error: 'Password must be at least 6 characters long.' });
        return;
      }

      // Check if user already exists
      for (const u of db.users.values()) {
        if (u.phone === cleanPhone) {
          res.status(409).json({ success: false, error: 'An account with this phone number already exists. Please log in.' });
          return;
        }
      }

      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      const userId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const newUser: User & { passwordHash: string } = {
        id: userId,
        name: name.trim(),
        phone: cleanPhone,
        passwordHash,
        avatar: avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${cleanPhone}`,
        age: age ? parseInt(age, 10) : 21,
        bio: (bio || '').trim() || 'Ready to plan spontaneous activities! ⚡',
        interests: Array.isArray(interests) && interests.length > 0 ? interests : ['Café', 'Movie', 'Food'],
        location: (location || 'Bengaluru, India').trim(),
        socialLinks: socialLinks || {},
        notificationPreferences: {
          joinRequests: true,
          messages: true,
          planUpdates: true,
          sound: true,
        },
        blockedUsers: [],
        createdAt: new Date().toISOString(),
      };

      db.users.set(userId, newUser);
      await db.users.saveUser(userId, newUser);

      // Welcome Notification
      const welcomeNotif = {
        id: `notif_${Date.now()}`,
        recipientId: userId,
        type: 'system' as const,
        title: 'Welcome to PlanMate! 🚀',
        message: 'Explore active plans or create your first squad activity today!',
        isRead: false,
        createdAt: new Date().toISOString(),
      };
      db.notifications.set(welcomeNotif.id, welcomeNotif);

      const token = generateToken(newUser);
      const { passwordHash: _, ...cleanUserData } = newUser;

      res.status(201).json({
        success: true,
        message: 'Account created successfully! Welcome to PlanMate.',
        token,
        user: cleanUserData,
      });
    } catch (error) {
      console.error('[Auth Register Error]', error);
      res.status(500).json({ success: false, error: 'Internal server error during registration.' });
    }
  }

  /**
   * Login: Verify phone & password and issue JWT.
   * No OTP or phone verification is required.
   */
  public static async login(req: Request, res: Response): Promise<void> {
    try {
      const { phone, password } = req.body;

      if (!phone || !password) {
        res.status(400).json({
          success: false,
          error: 'Phone number and password are required.',
        });
        return;
      }

      const cleanPhone = phone.replace(/[^0-9]/g, '');

      if (cleanPhone.length < 10) {
        res.status(400).json({
          success: false,
          error: 'Please enter a valid phone number.',
        });
        return;
      }

      let matchedUser: (User & { passwordHash: string }) | null = null;

      for (const u of db.users.values()) {
        if (u.phone === cleanPhone) {
          matchedUser = u;
          break;
        }
      }

      if (!matchedUser) {
        res.status(404).json({
          success: false,
          error: 'No account found with this phone number. Please register first.',
        });
        return;
      }

      const isMatch = await bcrypt.compare(
        password,
        matchedUser.passwordHash
      );

      if (!isMatch) {
        res.status(401).json({
          success: false,
          error: 'Incorrect password. Please try again.',
        });
        return;
      }

      const token = generateToken(matchedUser);
      const { passwordHash: _, ...cleanUser } = matchedUser;

      res.json({
        success: true,
        message: 'Login successful! Welcome back.',
        token,
        user: cleanUser,
      });
    } catch (error) {
      console.error('[Auth Login Error]', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error during login.',
      });
    }
  }

  /**
   * Get Current Authenticated User profile
   */
  public static getMe(req: AuthenticatedRequest, res: Response): void {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized.' });
      return;
    }
    const user = db.users.get(req.user.id);
    if (!user) {
      res.status(404).json({ success: false, error: 'User not found.' });
      return;
    }
    const { passwordHash, ...cleanUser } = user;
    res.json({ success: true, user: cleanUser });
  }
}
