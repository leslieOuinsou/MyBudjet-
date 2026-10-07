import express from 'express';
import passport from 'passport';
import { register, login, verifyTwoFactorLogin, googleCallback, addMissingDefaultData, registerAdmin, forgotPassword, resetPassword } from '../controllers/authController.js';
import { sendSMSCode, verifySMSCode } from '../controllers/smsAuthController.js';
import { validate, registerSchema, loginSchema } from '../validators/authValidator.js';
import { authenticateJWT } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', validate(registerSchema), register);
router.post('/signup', validate(registerSchema), register); // Ajouter cette route pour le frontend
router.post('/signup-admin', registerAdmin); // Inscription admin publique (avec code)
router.post('/login', validate(loginSchema), login);
router.post('/login/2fa', verifyTwoFactorLogin);

// Routes de réinitialisation de mot de passe
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Routes d'authentification par SMS
router.post('/sms/send-code', sendSMSCode);
router.post('/sms/verify-code', verifySMSCode);

const isGoogleOAuthEnabled = Boolean(
  process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
);

const googleOAuthNotConfigured = (req, res) => {
  res.status(503).json({
    message: 'Google OAuth non configuré. Ajoutez GOOGLE_CLIENT_ID et GOOGLE_CLIENT_SECRET dans backend/.env',
  });
};

if (isGoogleOAuthEnabled) {
  router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
  router.get(
    '/google/callback',
    passport.authenticate('google', { session: false, failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=google` }),
    googleCallback
  );
} else {
  router.get('/google', googleOAuthNotConfigured);
  router.get('/google/callback', googleOAuthNotConfigured);
}

// Route pour ajouter les données par défaut manquantes
router.post('/add-default-data', authenticateJWT, addMissingDefaultData);

export default router;
