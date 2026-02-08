import express from 'express';
import { chatController } from '../controllers/chatController.js';
import { messageController } from '../controllers/messageController.js';
import { authMiddleware } from '../middlewares/auth.js';
import { upload } from '../middlewares/upload.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/', chatController.getUserChats);
router.post('/', chatController.createChat);
router.post('/block', chatController.blockChat);
router.post('/message', upload.single('attachment'), messageController.sendMessage);
router.get('/message', messageController.getMessages);

export default router;
