import express from 'express';
import { getPublicKey, subscribe, unsubscribe, sendTest } from '../controllers/pushController.js';
import { authenticateJWT } from '../middleware/auth.js';

const router = express.Router();

router.get('/public-key', authenticateJWT, getPublicKey);
router.post('/subscribe', authenticateJWT, subscribe);
router.post('/unsubscribe', authenticateJWT, unsubscribe);
router.post('/test', authenticateJWT, sendTest);

export default router;
