import express from 'express';
import { authenticateJWT } from '../middleware/auth.js';
import { getRecurring, createRecurring, updateRecurring, deleteRecurring, processRecurring } from '../controllers/recurringController.js';

const router = express.Router();

router.get('/', authenticateJWT, getRecurring);
router.post('/', authenticateJWT, createRecurring);
router.put('/:id', authenticateJWT, updateRecurring);
router.delete('/:id', authenticateJWT, deleteRecurring);
router.post('/process', authenticateJWT, processRecurring); // manuel, limité à l'utilisateur ; le cron utilise /api/cron/recurring

export default router;
