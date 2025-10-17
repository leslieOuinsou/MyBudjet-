import express from 'express';
import { authenticateJWT } from '../middleware/auth.js';
import { exportCSV, exportExcel, exportPDF, importTransactions, exportReport } from '../controllers/importExportController.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

router.get('/export/csv', authenticateJWT, exportCSV);
router.get('/export/excel', authenticateJWT, exportExcel);
router.get('/export/pdf', authenticateJWT, exportPDF);
router.post('/import', authenticateJWT, upload.single('file'), importTransactions);
router.get('/report', authenticateJWT, exportReport);

export default router;
