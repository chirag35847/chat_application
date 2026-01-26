import { messageService } from '../services/messageService.js';

export const messageController = {
    async sendMessage(req, res) {

        // console.log(req.ip)
        // console.log(req.headers['x-forwarded-for'])
        // console.log(req.user.userId)
        // console.log(req.socket.remoteAddress)


        try {
            if (!req.body) {
                return res.status(400).json({
                    success: false,
                    data: null,
                    error: "Request body is missing"
                });
            }

            const { chatId, text } = req.body;
            const userId = req.user.userId;

            if (!chatId) {
                return res.status(400).json({
                    success: false,
                    data: null,
                    error: "chatId is required"
                });
            }

            const message = await messageService.sendMessage({
                chatId,
                text,
                userId,
                file: req.file
            });

            res.status(200).json({ success: true, data: message, error: null });
        } catch (error) {
            let status = 500;
            if (error.message.includes('not found') || error.message.includes('not a member')) status = 404;
            if (error.message.includes('locked')) status = 403;
            if (error.message.includes('required') || error.message.includes('failed')) status = 400;

            res.status(status).json({ success: false, data: null, error: error.message });
        }
    },

    async getMessages(req, res) {

        // console.log(req.ip)
        // console.log(req.headers['x-forwarded-for'])
        // console.log(req.user.userId)
        // console.log(req.socket.remoteAddress)

        try {
            const { chatId, limit, offset } = req.query;
            const userId = req.user.userId;

            if (!chatId) {
                return res.status(400).json({
                    success: false,
                    data: null,
                    error: "chatId is required"
                });
            }

            const messages = await messageService.getMessages({
                chatId,
                userId,
                limit: parseInt(limit) || 20,
                offset: parseInt(offset) || 0
            });

            res.status(200).json({ success: true, data: messages, error: null });
        } catch (error) {
            let status = 500;
            if (error.message.includes('not a member')) status = 403;
            res.status(status).json({ success: false, data: null, error: error.message });
        }
    }
};
