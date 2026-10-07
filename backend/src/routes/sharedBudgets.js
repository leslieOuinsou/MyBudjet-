import express from 'express';
import { authenticateJWT } from '../middleware/auth.js';
import {
  listSharedBudgets, createSharedBudget, getSharedBudget, deleteSharedBudget,
  addMember, removeMember, addExpense, deleteExpense, addSettlement,
} from '../controllers/sharedBudgetController.js';

const router = express.Router();
router.use(authenticateJWT);

router.get('/', listSharedBudgets);
router.post('/', createSharedBudget);
router.get('/:id', getSharedBudget);
router.delete('/:id', deleteSharedBudget);
router.post('/:id/members', addMember);
router.delete('/:id/members/:userId', removeMember);
router.post('/:id/expenses', addExpense);
router.delete('/:id/expenses/:expenseId', deleteExpense);
router.post('/:id/settlements', addSettlement);

export default router;
