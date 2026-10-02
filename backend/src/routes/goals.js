import express from 'express';
import { authenticateJWT } from '../middleware/auth.js';
import { getGoals, createGoal, updateGoal, deleteGoal } from '../controllers/goalController.js';

const router = express.Router();

router.get('/', authenticateJWT, getGoals);
router.post('/', authenticateJWT, createGoal);
router.put('/:id', authenticateJWT, updateGoal);
router.delete('/:id', authenticateJWT, deleteGoal);

export default router;
