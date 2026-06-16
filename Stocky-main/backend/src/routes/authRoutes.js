import express from 'express';
import { register, login, getUsers } from '../controllers/authController.js';
import { authenticateToken, authorizeAdmin } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/users', authenticateToken, authorizeAdmin, getUsers);

export default router;