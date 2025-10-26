import express from 'express';
import {
  getAuthorizationUrl,
  handleCallback,
  processCallback,
  getConnectionStatus,
  getBalance,
  getTransactions,
  syncTransactions,
  disconnect,
} from '../controllers/paypalController.js';
import { authenticateJWT } from '../middleware/auth.js';

const router = express.Router();

// Routes publiques (sans authentification)
router.get('/callback', handleCallback); // Callback GET pour PayPal (redirection depuis PayPal)
router.get('/auth-url', getAuthorizationUrl); // Obtenir l'URL d'autorisation (public)

// Routes protégées (avec authentification)
router.use(authenticateJWT);
router.post('/process-callback', processCallback); // Traiter le code d'autorisation
router.get('/status', getConnectionStatus); // Vérifier le statut de connexion
router.get('/balance', getBalance); // Récupérer le solde PayPal
router.get('/transactions', getTransactions); // Récupérer les transactions PayPal
router.post('/sync', syncTransactions); // Synchroniser les transactions
router.post('/disconnect', disconnect); // Déconnecter PayPal

export default router;

