import express from 'express';
import { authenticateJWT } from '../middleware/auth.js';
import { getDashboard } from '../controllers/dashboardController.js';

const router = express.Router();

router.get('/', authenticateJWT, getDashboard);

export default router;
