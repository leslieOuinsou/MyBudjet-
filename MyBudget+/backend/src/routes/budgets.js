import express from 'express';
import { authenticateJWT } from '../middleware/auth.js';
import { getBudgets, createBudget, updateBudget, deleteBudget } from '../controllers/budgetController.js';
import { validate, budgetSchema, updateBudgetSchema } from '../validators/budgetValidator.js';

const router = express.Router();

router.get('/', authenticateJWT, getBudgets);
router.post('/', authenticateJWT, validate(budgetSchema), createBudget);
router.put('/:id', authenticateJWT, validate(updateBudgetSchema), updateBudget);
router.delete('/:id', authenticateJWT, deleteBudget);

export default router;
