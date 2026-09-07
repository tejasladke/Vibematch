import express from 'express';
import {
  getPlans,
  getPlanById,
  createPlan,
  updatePlan,
  deletePlan,
  getMyCreatedPlans,
  getMyJoinedPlans,
} from '../controllers/planController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', getPlans);
router.get('/my/created', protect, getMyCreatedPlans);
router.get('/my/joined', protect, getMyJoinedPlans);
router.get('/:id', getPlanById);
router.post('/', protect, createPlan);
router.put('/:id', protect, updatePlan);
router.delete('/:id', protect, deletePlan);

export default router;
