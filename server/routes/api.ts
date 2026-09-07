import express, { Request, Response } from 'express';
import { AuthController } from '../controllers/authController.js';
import { PlanController } from '../controllers/planController.js';
import { RequestController } from '../controllers/requestController.js';
import { ConnectionController } from '../controllers/connectionController.js';
import { ChatController } from '../controllers/chatController.js';
import { NotificationController } from '../controllers/notificationController.js';
import { UserController } from '../controllers/userController.js';
import { authenticateToken, optionalAuth } from '../middleware/auth.js';
import { CloudinaryService } from '../services/cloudinaryService.js';

const router = express.Router();

// --- Health Check ---
router.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'PlanMate API', time: new Date().toISOString() });
});

// --- Auth Routes ---
router.post('/auth/register', AuthController.register);
router.post('/auth/login', AuthController.login);
router.get('/auth/me', authenticateToken, AuthController.getMe);

// --- Plan Routes ---
router.get('/plans', optionalAuth, PlanController.getPlans);
router.get('/plans/my/created', authenticateToken, PlanController.getMyCreatedPlans);
router.get('/plans/my/joined', authenticateToken, PlanController.getMyJoinedPlans);
router.get('/plans/:id', optionalAuth, PlanController.getPlanById);
router.post('/plans', authenticateToken, PlanController.createPlan);
router.put('/plans/:id', authenticateToken, PlanController.updatePlan);
router.delete('/plans/:id', authenticateToken, PlanController.deletePlan);

// --- Join Request Routes ---
router.post('/requests', authenticateToken, RequestController.createJoinRequest);
router.get('/requests/incoming', authenticateToken, RequestController.getIncomingRequests);
router.get('/requests/sent', authenticateToken, RequestController.getMySentRequests);
router.post('/requests/:id/accept', authenticateToken, RequestController.acceptRequest);
router.post('/requests/:id/reject', authenticateToken, RequestController.rejectRequest);

// --- Connection Routes ---
router.get('/connections', authenticateToken, ConnectionController.getMyConnections);
router.get('/connections/:id', authenticateToken, ConnectionController.getConnectionById);
router.post('/connections/:id/block', authenticateToken, ConnectionController.toggleBlockConnection);
router.post('/connections/report', authenticateToken, ConnectionController.reportUser);

// --- Chat Routes ---
router.get('/chat/:connectionId/messages', authenticateToken, ChatController.getMessages);
router.post('/chat/:connectionId/messages', authenticateToken, ChatController.sendMessage);
router.post('/chat/:connectionId/read', authenticateToken, ChatController.markAsRead);

// --- Notification Routes ---
router.get('/notifications', authenticateToken, NotificationController.getNotifications);
router.put('/notifications/read-all', authenticateToken, NotificationController.markAllAsRead);
router.put('/notifications/:id/read', authenticateToken, NotificationController.markAsRead);

// --- User Profile & Settings Routes ---
router.get('/users/:id', optionalAuth, UserController.getUserProfile);
router.put('/users/profile', authenticateToken, UserController.updateProfile);
router.put('/users/password', authenticateToken, UserController.changePassword);
router.put('/users/notification-preferences', authenticateToken, UserController.updateNotificationPreferences);

// --- Image Upload Endpoint (Cloudinary-ready with base64 dev fallback) ---
router.post('/upload', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { image, folder = 'plans' } = req.body;
    if (!image) {
      res.status(400).json({ success: false, error: 'No image payload provided' });
      return;
    }

    const uploadResult = await CloudinaryService.uploadImage(image, folder);
    if (!uploadResult.success) {
      res.status(500).json({ success: false, error: uploadResult.error || 'Failed to upload image' });
      return;
    }

    res.json({ success: true, url: uploadResult.url });
  } catch (error) {
    console.error('[Upload API Error]', error);
    res.status(500).json({ success: false, error: 'Internal error processing image upload' });
  }
});

export default router;
