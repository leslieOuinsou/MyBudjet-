import express from 'express';
import passport from 'passport';
import { register, login, googleCallback, addMissingDefaultData, registerAdmin, forgotPassword, resetPassword } from '../controllers/authController.js';
import { validate, registerSchema, loginSchema } from '../validators/authValidator.js';
import { authenticateJWT } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', validate(registerSchema), register);
router.post('/signup', validate(registerSchema), register); // Ajouter cette route pour le frontend
router.post('/signup-admin', registerAdmin); // Inscription admin publique (avec code)
router.post('/login', validate(loginSchema), login);

// Routes de réinitialisation de mot de passe
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Google OAuth routes temporairement désactivées
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback', passport.authenticate('google', { session: false }), googleCallback);

// Route pour ajouter les données par défaut manquantes
router.post('/add-default-data', authenticateJWT, addMissingDefaultData);

export default router;
