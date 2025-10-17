import express from 'express';
import { getWallets, getWallet, createWallet, updateWallet, deleteWallet, getWalletsSummary } from '../controllers/walletController.js';
import { authenticateJWT } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticateJWT, getWallets);
router.get('/:id', authenticateJWT, getWallet);
router.post('/', authenticateJWT, createWallet);
router.put('/:id', authenticateJWT, updateWallet);
router.delete('/:id', authenticateJWT, deleteWallet);
router.get('/summary', authenticateJWT, getWalletsSummary);

export default router;
