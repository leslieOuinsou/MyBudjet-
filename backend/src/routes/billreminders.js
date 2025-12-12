import express from 'express';
import { authenticateJWT } from '../middleware/auth.js';
import { getReminders, createReminder, updateReminder, deleteReminder, processReminders } from '../controllers/billReminderController.js';

const router = express.Router();

router.get('/', authenticateJWT, getReminders);
router.post('/', authenticateJWT, createReminder);
router.put('/:id', authenticateJWT, updateReminder);
router.delete('/:id', authenticateJWT, deleteReminder);
router.post('/process', processReminders); // à appeler via cron ou manuellement

export default router;
