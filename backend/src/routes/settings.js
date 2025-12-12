import express from 'express';
import { 
  getUserPreferences, 
  updateUserPreferences, 
  changePassword, 
  updateProfile,
  deleteAccount,
  exportUserData,
  uploadProfilePicture,
  deleteProfilePicture
} from '../controllers/settingsController.js';
import { authenticateJWT } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

// Toutes les routes nécessitent une authentification
router.use(authenticateJWT);

// Routes pour les préférences
router.get('/preferences', getUserPreferences);
router.put('/preferences', updateUserPreferences);

// Routes pour le profil
router.put('/profile', updateProfile);
router.put('/password', changePassword);
router.post('/profile/picture', upload.single('avatar'), uploadProfilePicture);
router.delete('/profile/picture', deleteProfilePicture);

// Routes pour la gestion du compte
router.delete('/account', deleteAccount);
router.get('/export', exportUserData);

export default router;
