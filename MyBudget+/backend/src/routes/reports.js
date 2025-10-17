import express from 'express';
import { 
  getReportsData,
  getFinancialStats,
  getCategoryAnalytics,
  getBudgetComparison,
  getMonthlyTrends,
  getTopTransactions,
  exportReportData
} from '../controllers/reportsController.js';
import { authenticateJWT } from '../middleware/auth.js';

const router = express.Router();

// Route de test (sans authentification pour le debug)
router.get('/test', (req, res) => {
  res.json({ message: 'Reports router is working!', timestamp: new Date().toISOString() });
});

// Route principale pour tous les données de rapport
router.get('/', authenticateJWT, getReportsData);

// Routes spécifiques
router.get('/stats', authenticateJWT, getFinancialStats);
router.get('/categories', authenticateJWT, getCategoryAnalytics);
router.get('/budget-comparison', authenticateJWT, getBudgetComparison);
router.get('/trends', authenticateJWT, getMonthlyTrends);
router.get('/top-transactions', authenticateJWT, getTopTransactions);
router.get('/export', authenticateJWT, exportReportData);

export default router;
