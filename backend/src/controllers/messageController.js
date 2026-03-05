import { messageService } from '../services/messageService.js';

export const messageController = {
    async sendMessage(req, res) {
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

            // Emit the message to the chat room (excluding the sender)
            const { getIO } = await import('../config/socket.js');
            const io = getIO();
            const socketId = req.headers['x-socket-id'];

            if (socketId) {
                io.to(chatId).except(socketId).emit('receive_message', message);
            } else {
                io.to(chatId).emit('receive_message', message);
            }

            // Also emit to all participants' personal rooms for sidebar updates
            try {
                const { prisma } = await import('../config/prisma.js');
                const chat = await prisma.chat.findUnique({
                    where: { id: chatId },
                    include: { users: { select: { userId: true } } }
                });

                if (chat) {
                    chat.users.forEach(u => {
                        const room = `user_${u.userId}`;
                        // We emit to all participants. If they are in the chat room, they'll handle duplicates.
                        if (u.userId === userId && socketId) {
                            io.to(room).except(socketId).emit('receive_message', message);
                        } else {
                            io.to(room).emit('receive_message', message);
                        }
                    });
                }
            } catch (err) {
                console.error("Failed to emit sidebar updates:", err);
            }

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
    },

    async markAsRead(req, res) {
        try {
            const { chatId } = req.body;
            const userId = req.user.userId;

            if (!chatId) {
                return res.status(400).json({ success: false, data: null, error: "chatId is required" });
            }

            await messageService.markAsRead(chatId, userId);
            res.status(200).json({ success: true, data: null, error: null });
        } catch (error) {
            res.status(500).json({ success: false, data: null, error: error.message });
        }
    }
};
