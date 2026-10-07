import express from 'express';
import { getTransactions, getTransaction, createTransaction, updateTransaction, deleteTransaction, getTrash, restoreTransaction, purgeTransaction, emptyTrash, getActivity } from '../controllers/transactionController.js';
import { authenticateJWT } from '../middleware/auth.js';
import { uploadAttachment } from '../middleware/upload.js';
import { validate, transactionSchema, updateTransactionSchema } from '../validators/transactionValidator.js';

const router = express.Router();

// Middleware pour mapper 'notes' vers 'note' (compatibilité frontend)
const mapNotesToNote = (req, res, next) => {
  if (req.body.notes !== undefined && req.body.note === undefined) {
    req.body.note = req.body.notes;
  }
  next();
};

router.get('/', authenticateJWT, getTransactions);
router.get('/trash', authenticateJWT, getTrash);
router.get('/activity', authenticateJWT, getActivity);
router.delete('/trash', authenticateJWT, emptyTrash);
router.post('/:id/restore', authenticateJWT, restoreTransaction);
router.delete('/:id/permanent', authenticateJWT, purgeTransaction);
router.get('/:id', authenticateJWT, getTransaction);
router.post('/', authenticateJWT, uploadAttachment.single('attachment'), mapNotesToNote, validate(transactionSchema), createTransaction);
router.put('/:id', authenticateJWT, uploadAttachment.single('attachment'), mapNotesToNote, validate(updateTransactionSchema), updateTransaction);
router.delete('/:id', authenticateJWT, deleteTransaction);

export default router;
