import { prisma } from '../config/prisma.js';

export const messageRepository = {
    async createMessage({ encryptedText, blobLocation, chatId, senderId, messageType }) {
        const message = await prisma.message.create({
            data: {
                text: encryptedText,
                blob_location: blobLocation,
                chat_id: chatId,
                sender_id: senderId,
                type: messageType
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
