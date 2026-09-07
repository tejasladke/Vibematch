import express from 'express';
import multer from 'multer';
import { uploadToCloudinary } from '../utils/cloudinaryService.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

router.post('/', protect, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No image file uploaded' });
    }

    const folder = req.body.folder || 'planmate';
    const result = await uploadToCloudinary(req.file.buffer, folder);

    res.json({ success: true, url: result.url });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
