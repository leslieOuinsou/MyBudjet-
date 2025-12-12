import express from 'express';
import { uploadBankCSV, importBankTransactions } from '../controllers/importBankController.js';
import { authenticateJWT } from '../middleware/auth.js';

const router = express.Router();

// Toutes les routes nécessitent une authentification
router.use(authenticateJWT);

// Routes
router.post('/parse-csv', uploadBankCSV); // Parser et prévisualiser le CSV
router.post('/import-transactions', importBankTransactions); // Importer les transactions

export default router;

