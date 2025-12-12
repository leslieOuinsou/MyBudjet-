import express from 'express';
import { authenticateJWT } from '../middleware/auth.js';
import { getRecurring, createRecurring, deleteRecurring, processRecurring } from '../controllers/recurringController.js';

const router = express.Router();

router.get('/', authenticateJWT, getRecurring);
router.post('/', authenticateJWT, createRecurring);
router.delete('/:id', authenticateJWT, deleteRecurring);
router.post('/process', processRecurring); // à appeler via cron ou manuellement

export default router;
