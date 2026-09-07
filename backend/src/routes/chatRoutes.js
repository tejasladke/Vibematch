import express from 'express';
import { getMessages, sendMessage, markAsRead } from '../controllers/chatController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/:connectionId/messages', protect, getMessages);
router.post('/:connectionId/messages', protect, sendMessage);
router.post('/:connectionId/read', protect, markAsRead);

export default router;
