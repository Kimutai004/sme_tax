import express from 'express';
import {
  getUnread, getAll, markRead, markAllRead, generateReminders, generateSummary
} from '../controllers/notificationController.js';
import { protect } from '../middleware/errorHandler.js';

const router = express.Router();

router.use(protect);

router.get('/unread', getUnread);
router.get('/', getAll);
router.put('/read-all', markAllRead);
router.put('/:id/read', markRead);
router.post('/generate-reminders', generateReminders);
router.post('/generate-summary', generateSummary);

export default router;
