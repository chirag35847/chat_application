import { chatRepository } from '../repositories/chatRepository.js';
import { decryptText } from '../utils/crypto.js';

export const chatService = {
    async createChat({ userIds, name, adminUserId }) {
        const isGroupChat = userIds.length > 1;

        if (isGroupChat && !name) {
            throw new Error('chat name is required in case of group chat');
        }

        // For 1-on-1 chats, check if blocked
        if (!isGroupChat) {
            const blockedUser = await chatRepository.isUserBlocked(adminUserId, userIds[0]);
            if (blockedUser) {
                let errorMessage = "you have blocked the other user";
                if (blockedUser.blockerId !== adminUserId) {
                    errorMessage = "you were blocked by the other user";
                }
                throw new Error(errorMessage);
            }
        }

        return await chatRepository.createChat({
            name,
            isGroup: isGroupChat,
            userIds,
            adminUserId
        });
    },

    async blockChat(chatId, userId) {
        const chat = await chatRepository.findChatByIdAndUser(chatId, userId, true);
        if (!chat) {
            throw new Error('No chat found');
        }

        const updatedChat = await chatRepository.updateChatStatus(chatId, 'LOCKED');

        if (!updatedChat.isGroup) {
            const otherUser = updatedChat.users.find(u => u.userId !== userId);
            if (otherUser) {
                await chatRepository.blockUser(userId, otherUser.userId);
            }
        }

        return updatedChat;
    },

    async getUserChats(userId) {
        const chats = await chatRepository.findUserChats(userId);

        return chats.map(chat => {
            if (chat.messages && chat.messages.length > 0) {
                const lastMsg = chat.messages[0];
                if (lastMsg.text && lastMsg.sender?.publicKey) {
                    try {
                        lastMsg.text = decryptText(lastMsg.text, lastMsg.sender.publicKey.key);
                    } catch (err) {
                        console.error(`Failed to decrypt last message for chat ${chat.id}:`, err);
                        lastMsg.text = "[Error Decrypting]";
                    }
                }
            }
            return chat;
        });
    }
};
