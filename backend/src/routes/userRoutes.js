import express from 'express';
import {
  getUserProfile,
  updateProfile,
  changePassword,
  updateNotificationPreferences,
} from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/:id', getUserProfile);
router.put('/profile', protect, updateProfile);
router.put('/password', protect, changePassword);
router.put('/notification-preferences', protect, updateNotificationPreferences);

export default router;
