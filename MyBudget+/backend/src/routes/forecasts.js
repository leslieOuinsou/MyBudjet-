import express from 'express';
import { authenticateJWT } from '../middleware/auth.js';
import { 
  getFinancialForecast, 
  getPersonalizedAdvice, 
  getForecastChart,
  getProjectedBalance,
  updateForecastSettings
} from '../controllers/forecastController.js';

const router = express.Router();

// Routes pour les prévisions financières
router.get('/balance', authenticateJWT, getProjectedBalance);
router.get('/chart', authenticateJWT, getForecastChart);
router.get('/advice', authenticateJWT, getPersonalizedAdvice);
router.get('/overview', authenticateJWT, getFinancialForecast);
router.post('/settings', authenticateJWT, updateForecastSettings);

export default router;
