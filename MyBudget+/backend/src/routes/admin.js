import express from 'express';
import { authenticateJWT } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/admin.js';
import { 
  getAllUsers, 
  blockUser, 
  unblockUser, 
  deleteUser, 
  getStats,
  updateUserRole,
  getUserStats,
  getAllBillReminders,
  getAllRecurringTransactions,
  createAdmin
} from '../controllers/adminController.js';

const router = express.Router();

router.use(authenticateJWT, requireAdmin);

// Routes utilisateurs
router.get('/users', getAllUsers);
router.put('/users/:id/block', blockUser);
router.put('/users/:id/unblock', unblockUser);
router.put('/users/:id/role', updateUserRole);
router.delete('/users/:id', deleteUser);
router.get('/users/:id/stats', getUserStats);

// Routes statistiques
router.get('/stats', getStats);

// Routes rappels et récurrentes
router.get('/billreminders', getAllBillReminders);
router.get('/recurring', getAllRecurringTransactions);

// Route création admin (nécessite d'être déjà admin)
router.post('/create-admin', createAdmin);

export default router;
