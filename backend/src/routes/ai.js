import express from 'express';
import { authenticateJWT } from '../middleware/auth.js';
import { getForecast, getAdvice, getSavingSuggestion, getSubscriptions, getHealthScore, suggestCategory } from '../controllers/aiController.js';

import { receiptUpload, aiLimiter, requireClaude, scanReceipt, askAssistant, aiStatus } from '../controllers/claudeController.js';

const router = express.Router();

router.get('/forecast', authenticateJWT, getForecast);
router.get('/advice', authenticateJWT, getAdvice);
router.get('/saving', authenticateJWT, getSavingSuggestion);
router.get('/subscriptions', authenticateJWT, getSubscriptions);
router.get('/health-score', authenticateJWT, getHealthScore);
router.get('/suggest-category', authenticateJWT, suggestCategory);
router.get('/status', authenticateJWT, aiStatus);
router.post('/ask', authenticateJWT, requireClaude, aiLimiter, askAssistant);
router.post(
  '/scan-receipt',
  authenticateJWT,
  requireClaude,
  aiLimiter,
  (req, res, next) => receiptUpload(req, res, (err) => (err ? res.status(400).json({ message: err.message }) : next())),
  scanReceipt
);

export default router;
