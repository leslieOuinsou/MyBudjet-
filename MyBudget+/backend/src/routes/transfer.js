import express from 'express';
import { authenticateJWT } from '../middleware/auth.js';
import { transfer } from '../controllers/transferController.js';

const router = express.Router();

router.post('/', authenticateJWT, transfer);

export default router;
