import express from 'express';
import { authenticateJWT } from '../middleware/auth.js';
import { getForecast, getAdvice, getSavingSuggestion } from '../controllers/aiController.js';

const router = express.Router();

router.get('/forecast', authenticateJWT, getForecast);
router.get('/advice', authenticateJWT, getAdvice);
router.get('/saving', authenticateJWT, getSavingSuggestion);

export default router;
