import express from 'express';
import { userController } from '../controllers/userController.js';
import { authMiddleware } from '../middlewares/auth.js';

const router = express.Router();

router.post('/register', userController.register);
router.post('/login', userController.login);
router.get('/search', authMiddleware, userController.search);

export default router;
