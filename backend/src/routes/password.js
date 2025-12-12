import express from 'express';
import { requestPasswordReset, resetPassword } from '../controllers/passwordController.js';

const router = express.Router();

router.post('/request-reset', requestPasswordReset);
router.post('/reset', resetPassword);

export default router;
