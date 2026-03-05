import express from 'express';
import { userController } from '../controllers/userController.js';
import { authMiddleware } from '../middlewares/auth.js';

const router = express.Router();

router.post('/register', userController.register);
router.post('/login', userController.login);
router.post('/refresh', userController.refresh);
router.post('/logout', authMiddleware, userController.logout);
router.get('/search', authMiddleware, userController.search);
router.get('/me', authMiddleware, userController.getProfile);



export default router;
