import express from 'express';
import { authenticateJWT } from '../middleware/auth.js';
import { listRates, getAccountsSummary } from '../controllers/currencyController.js';

const router = express.Router();
router.get('/rates', authenticateJWT, listRates);
router.get('/accounts-summary', authenticateJWT, getAccountsSummary);

export default router;
