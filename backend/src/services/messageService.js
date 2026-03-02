import { messageRepository } from '../repositories/messageRepository.js';
import { chatRepository } from '../repositories/chatRepository.js';
import { userRepository } from '../repositories/userRepository.js';
import { encryptText, decryptText } from '../utils/crypto.js';
import { s3, s3BucketName } from '../config/s3.js';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { redisHelpers } from '../redis/helpers.js';
import { REDIS_KEYS } from '../redis/keys.js';

export const messageService = {
    async sendMessage({ chatId, text, userId, file }) {
        const chat = await chatRepository.findChatByIdAndUser(chatId, userId);
        if (!chat) {
            throw new Error('Chat not found or you are not a member');
        }

        if (chat.chatStatus === "LOCKED") {
            throw new Error("This chat is locked");
        }

        let encryptedText = null;
        let blobLocation = null;

        if (text) {
            const user = await userRepository.findById(userId, { privateKey: true });
            if (!user || !user.privateKey) {
                throw new Error("User private key not found");
            }

            try {
                encryptedText = encryptText(text, user.privateKey);
            } catch (err) {
                throw new Error("Encryption failed. Message might be too long for the RSA key size.");
            }
        }

        if (file) {
            blobLocation = file.key;
        }

        if (!text && !file) {
            throw new Error("Either text or an attachment must be provided");
        }

        let messageType = 'TEXT';
        if (file) {
            if (file.mimetype === 'application/pdf') {
                messageType = 'PDF';
            } else if (file.mimetype.startsWith('audio/')) {
                messageType = 'VOICENOTE';
            }
        }

        const message = await messageRepository.createMessage({
            encryptedText,
            blobLocation,
            chatId,
            senderId: userId,
            messageType
        });

        // Fetch public key to decrypt for the response/broadcast
        const sender = await userRepository.findById(userId, { publicKey: true });

        let decryptedText = text;
        if (encryptedText && sender?.publicKey) {
            try {
                decryptedText = decryptText(encryptedText, sender.publicKey.key);
            } catch (err) {
                console.error("Failed to decrypt message for immediate response:", err);
            }
        }

        return {
            ...message,
            text: decryptedText || encryptedText
        };
    },

    async getMessages({ chatId, userId, limit = 20, offset = 0 }) {
        const userInChat = await chatRepository.isUserInChat(chatId, userId);
        if (!userInChat) {
            throw new Error("You are not a member of this chat");
        }

        const messages = await messageRepository.getMessagesByChatId(chatId, limit, offset);

        return await Promise.all(messages.map(async (msg) => {
            let decryptedText = null;
            let presignedUrl = null;

            if (msg.text && msg.sender.publicKey) {
                try {
                    decryptedText = decryptText(msg.text, msg.sender.publicKey.key);
                } catch (err) {
                    console.error(`Failed to decrypt message ${msg.id}:`, err);
                    decryptedText = "[Error Decrypting Message]";
                }
            }

            if (msg.blob_location) {
                try {
                    const cacheKey = REDIS_KEYS.PRESIGNED_URL(msg.blob_location);
                    const cachedUrl = await redisHelpers.getCache(cacheKey);

                    if (cachedUrl) {
                        presignedUrl = cachedUrl;
                    } else {
                        const command = new GetObjectCommand({
                            Bucket: s3BucketName,
                            Key: msg.blob_location
                        });
                        presignedUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });

                        // Cache for slightly less than expiry to be safe (e.g., 3500s)
                        await redisHelpers.setCache(cacheKey, presignedUrl, 3500);
                    }
                } catch (err) {
                    console.error(`Failed to generate/retrieve presigned URL for message ${msg.id}:`, err);
                }
            }

            const formattedMsg = { ...msg };
            delete formattedMsg.sender.publicKey;
            delete formattedMsg.sender_id;
            delete formattedMsg.chat_id;

            return {
                ...formattedMsg,
                text: decryptedText || msg.text,
                presignedUrl
            };
        }));
    }
};
