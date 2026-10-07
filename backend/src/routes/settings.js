import express from 'express';
import { 
  getUserPreferences, 
  updateUserPreferences, 
  changePassword, 
  updateProfile,
  deleteAccount,
  exportUserData,
  uploadProfilePicture,
  deleteProfilePicture,
  sendTwoFactorEnableCode,
  enableTwoFactor,
  disableTwoFactor,
  listSessions,
  revokeSession,
  revokeOtherSessions
} from '../controllers/settingsController.js';
import { authenticateJWT } from '../middleware/auth.js';
import { uploadAvatar } from '../middleware/upload.js';

const router = express.Router();

// Toutes les routes nécessitent une authentification
router.use(authenticateJWT);

// Routes pour les préférences
router.get('/preferences', getUserPreferences);
router.put('/preferences', updateUserPreferences);

// Routes pour le profil
router.put('/profile', updateProfile);
router.put('/password', changePassword);
router.post('/profile/picture', uploadAvatar.single('avatar'), uploadProfilePicture);
router.delete('/profile/picture', deleteProfilePicture);

// Double authentification (activation par code reçu par email)
router.post('/2fa/send-code', sendTwoFactorEnableCode);
router.post('/2fa/enable', enableTwoFactor);
router.post('/2fa/disable', disableTwoFactor);

// Sessions actives
router.get('/sessions', listSessions);
router.delete('/sessions', revokeOtherSessions);
router.delete('/sessions/:id', revokeSession);

// Routes pour la gestion du compte
router.delete('/account', deleteAccount);
router.get('/export', exportUserData);

export default router;
