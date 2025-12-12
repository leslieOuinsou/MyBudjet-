import express from 'express';
import { getTransactions, getTransaction, createTransaction, updateTransaction, deleteTransaction } from '../controllers/transactionController.js';
import { authenticateJWT } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { validate, transactionSchema, updateTransactionSchema } from '../validators/transactionValidator.js';

const router = express.Router();

router.get('/', authenticateJWT, getTransactions);
router.get('/:id', authenticateJWT, getTransaction);
router.post('/', authenticateJWT, upload.single('attachment'), validate(transactionSchema), createTransaction);
router.put('/:id', authenticateJWT, upload.single('attachment'), validate(updateTransactionSchema), updateTransaction);
router.delete('/:id', authenticateJWT, deleteTransaction);

export default router;
