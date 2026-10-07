import express from 'express';
import { demoStatus, loadDemoData, removeDemoData } from '../controllers/demoController.js';
import { authenticateJWT } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticateJWT, demoStatus);
router.post('/', authenticateJWT, loadDemoData);
router.delete('/', authenticateJWT, removeDemoData);

export default router;
