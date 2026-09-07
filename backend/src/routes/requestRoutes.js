import express from 'express';
import {
  createJoinRequest,
  getIncomingRequests,
  getMySentRequests,
  acceptRequest,
  rejectRequest,
} from '../controllers/requestController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', protect, createJoinRequest);
router.get('/incoming', protect, getIncomingRequests);
router.get('/sent', protect, getMySentRequests);
router.post('/:id/accept', protect, acceptRequest);
router.post('/:id/reject', protect, rejectRequest);

export default router;
