import { prisma } from '../config/prisma.js';

export const messageRepository = {
    async createMessage({ encryptedText, blobLocation, chatId, senderId, messageType }) {
        // Get all users in the chat to create metadata
        const chat = await prisma.chat.findUnique({
            where: { id: chatId },
            include: { users: { select: { userId: true } } }
        });

        const otherUsers = chat.users.filter(u => u.userId !== senderId);

        const message = await prisma.message.create({
            data: {
                text: encryptedText,
                blob_location: blobLocation,
                chat_id: chatId,
                sender_id: senderId,
                type: messageType,
                metadata: {
                    create: otherUsers.map(u => ({
                        userId: u.userId,
                        status: 'UNREAD'
                    }))
                }
            }
        });

        return await prisma.message.findUnique({
            where: { id: message.id },
            include: {
                sender: {
                    select: {
                        id: true,
                        username: true
                    }
                }
            }
        });
    },

    async markMessagesAsRead(chatId, userId) {
        return await prisma.userMessageMetadata.updateMany({
            where: {
                userId: userId,
                message: {
                    chat_id: chatId
                },
                status: 'UNREAD'
            },
            data: {
                status: 'READ',
                seenAt: new Date()
            }
        });
    },

    async getMessagesByChatId(chatId, limit, offset) {
        return await prisma.message.findMany({
            where: { chat_id: chatId },
            take: limit,
            skip: offset,
            orderBy: { created_at: 'desc' },
            include: {
                sender: {
                    select: {
                        id: true,
                        username: true,
                        publicKey: true
                    }
                }
            }
        });
    }
};
