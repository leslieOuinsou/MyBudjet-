import express from 'express';
import {
  getBankAccounts,
  getBankAccountById,
  createBankAccount,
  updateBankAccount,
  deleteBankAccount,
  setPrimaryAccount,
  getBankAccountsStats,
} from '../controllers/bankAccountController.js';
import { authenticateJWT } from '../middleware/auth.js';

const router = express.Router();

// Toutes les routes nécessitent une authentification
router.use(authenticateJWT);

// Routes
router.get('/', getBankAccounts); // Obtenir tous les comptes bancaires
router.get('/stats', getBankAccountsStats); // Statistiques des comptes
router.get('/:id', getBankAccountById); // Obtenir un compte spécifique
router.post('/', createBankAccount); // Créer un nouveau compte
router.put('/:id', updateBankAccount); // Mettre à jour un compte
router.delete('/:id', deleteBankAccount); // Supprimer un compte
router.patch('/:id/set-primary', setPrimaryAccount); // Définir comme compte principal

export default router;

