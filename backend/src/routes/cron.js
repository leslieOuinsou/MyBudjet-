import express from 'express';
import { runBillReminderScan } from '../controllers/billReminderController.js';
import { runRecurringScan } from '../controllers/recurringController.js';
import { runWeeklySummaryScan } from '../utils/weeklySummary.js';

const router = express.Router();

/**
 * Protection des routes cron :
 * - Si CRON_SECRET est défini : Vercel envoie automatiquement
 *   « Authorization: Bearer <CRON_SECRET> » avec chaque invocation de cron.
 * - Sinon : autorisé uniquement en développement local.
 */
const verifyCronSecret = (req, res, next) => {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const header = req.headers.authorization || '';
    if (header === `Bearer ${secret}`) return next();
    return res.status(401).json({ message: 'Non autorisé' });
  }
  if (process.env.NODE_ENV === 'development') return next();
  return res.status(401).json({ message: 'CRON_SECRET non configuré' });
};

router.use(verifyCronSecret);

// Rappels de factures — quotidien
router.get('/bill-reminders', async (req, res) => {
  try {
    const result = await runBillReminderScan();
    res.json({ message: 'Scan des factures terminé', ...result });
  } catch (error) {
    console.error('Erreur cron bill-reminders:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Transactions récurrentes — quotidien
router.get('/recurring', async (req, res) => {
  try {
    const result = await runRecurringScan();
    res.json({ message: 'Récurrences traitées', ...result });
  } catch (error) {
    console.error('Erreur cron recurring:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Résumé hebdomadaire — une fois par semaine
router.get('/weekly-summary', async (req, res) => {
  try {
    const result = await runWeeklySummaryScan();
    res.json({ message: 'Résumés hebdomadaires générés', ...result });
  } catch (error) {
    console.error('Erreur cron weekly-summary:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

export default router;
