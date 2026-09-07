import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../db.js';
import { User } from '../types.js';

export interface AuthenticatedRequest extends Request {
  user?: User;
}

/**
 * JWT secret must be provided through .env
 */
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error(
    'JWT_SECRET is missing from .env'
  );
}

/**
 * Authenticate user using JWT
 */
export function authenticateToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'Authorization header is required.',
      });
    }

    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Invalid authorization format.',
      });
    }

    const token = authHeader.substring(7).trim();

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication token is missing.',
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId?: string;
      id?: string;
      email?: string;
    };

    const userId = decoded.userId || decoded.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Invalid authentication token.',
      });
    }

    const user = db.users.get(userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found.',
      });
    }

    req.user = user;

    next();
  } catch (error) {
    console.error('[AUTH] Authentication error:', error);

    return res.status(401).json({
      success: false,
      message: 'Invalid or expired authentication token.',
    });
  }
}

/**
 * Optional authentication.
 *
 * If a valid token exists, req.user is populated.
 * If no token exists, request continues normally.
 */
export function optionalAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.substring(7).trim();

    if (!token) {
      return next();
    }

    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId?: string;
      id?: string;
    };

    const userId = decoded.userId || decoded.id;

    if (userId) {
      const user = db.users.get(userId);

      if (user) {
        req.user = user;
      }
    }

    next();
  } catch {
    // Optional auth should not block the request.
    next();
  }
}

/**
 * Generate JWT for logged-in user
 */
export function generateToken(user: User): string {
  const expiresIn =
    process.env.JWT_EXPIRES_IN || '7d';

  return jwt.sign(
    {
      userId: user.id,
    },
    JWT_SECRET,
    {
      expiresIn: expiresIn as any,
    }
  );
}