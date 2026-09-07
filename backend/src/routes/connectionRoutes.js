import express from 'express';
import {
  getMyConnections,
  getConnectionById,
  toggleBlockConnection,
} from '../controllers/connectionController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, getMyConnections);
router.get('/:id', protect, getConnectionById);
router.post('/:id/block', protect, toggleBlockConnection);

export default router;
