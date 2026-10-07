import express from 'express';
import { authenticateJWT } from '../middleware/auth.js';
import {
  uploadDocument, listDocuments, createDocument, downloadDocument, updateDocument, deleteDocument, handleUploadError,
} from '../controllers/documentController.js';

const router = express.Router();

router.get('/', authenticateJWT, listDocuments);
router.post('/', authenticateJWT, uploadDocument.single('file'), handleUploadError, createDocument);
router.get('/:id/file', authenticateJWT, downloadDocument);
router.put('/:id', authenticateJWT, updateDocument);
router.delete('/:id', authenticateJWT, deleteDocument);

export default router;
