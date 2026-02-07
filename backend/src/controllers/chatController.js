import { chatService } from '../services/chatService.js';

export const chatController = {
    async createChat(req, res) {
        try {
            const { userIds, name } = req.body;
            const adminUserId = req.user.userId;

            if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
                return res.status(400).send({
                    success: false,
                    data: null,
                    error: "no users to create the chat with"
                });
            }

            const chat = await chatService.createChat({ userIds, name, adminUserId });
            res.status(200).send({ success: true, data: chat, error: null });
        } catch (error) {
            res.status(400).send({ success: false, data: null, error: error.message });
        }
    },

    async blockChat(req, res) {
        try {
            const { chatId } = req.body;
            if (!chatId) {
                return res.status(400).send({
                    success: false,
                    data: null,
                    error: "chatId is a mandatory field"
                });
            }

            await chatService.blockChat(chatId, req.user.userId);
            res.status(200).send({ success: true, data: null, error: null });
        } catch (error) {
            const status = error.message === 'No chat found' ? 404 : 500;
            res.status(status).send({ success: false, data: null, error: error.message });
        }
    },

    async getUserChats(req, res) {
        try {
            const chats = await chatService.getUserChats(req.user.userId);
            res.status(200).send({ success: true, data: chats, error: null });
        } catch (error) {
            res.status(500).send({ success: false, data: null, error: error.message });
        }
    }
};
