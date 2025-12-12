import express from 'express';
import { getUsers, getUser, createUser, updateUser, deleteUser, getCurrentUser, updateProfile, deleteAccount, exportMyData } from '../controllers/userController.js';
import { authenticateJWT } from '../middleware/auth.js';

const router = express.Router();

router.get('/', getUsers);
router.get('/me', authenticateJWT, getCurrentUser);
router.get('/:id', getUser);
router.post('/', createUser);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);
router.put('/me', authenticateJWT, updateProfile);
router.delete('/me', authenticateJWT, deleteAccount);
router.get('/me/export', authenticateJWT, exportMyData);

export default router;
