import express from 'express';
import { getCategories, getCategory, createCategory, updateCategory, deleteCategory } from '../controllers/categoryController.js';
import { authenticateJWT } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticateJWT, getCategories);
router.get('/:id', authenticateJWT, getCategory);
router.post('/', authenticateJWT, createCategory);
router.put('/:id', authenticateJWT, updateCategory);
router.delete('/:id', authenticateJWT, deleteCategory);

export default router;
