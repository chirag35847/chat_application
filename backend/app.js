import express from 'express';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { v4 } from 'uuid';
import { prisma } from './lib/prisma.js'
import crypto from 'crypto'
import jwt from 'jsonwebtoken'
import { notEqual } from 'assert';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import multer from 'multer';
import multerS3 from 'multer-s3';

dotenv.config();

const app = express();
app.use(express.json());

const s3 = new S3Client({
    endpoint: process.env.S3_ENDPOINT,
    credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY,
        secretAccessKey: process.env.S3_SECRET_KEY,
    },
    region: process.env.S3_REGION,
    forcePathStyle: true, // Required for MinIO
});

const upload = multer({
    storage: multerS3({
        s3: s3,
        bucket: process.env.S3_BUCKET_NAME,
        metadata: function (req, file, cb) {
            cb(null, { fieldName: file.fieldname });
        },
        key: function (req, file, cb) {
            cb(null, `${v4()}-${file.originalname}`);
        }
    })
});

app.get("/", (req, res) => {
    res.send("I am up")
})

app.post("/user/register", async (req, res) => {
    const body = req.body;
    const { email, username, password } = body;

    if (!email || !username || !password) {
        res.status(400).json({
            "data": null,
            "success": false,
            "error": "either of email, username or password was not provided"
        })
    }
    const hashedPassword = await bcrypt.hash(password, 10);

    const keyPair = crypto.generateKeyPairSync("rsa", {
        modulusLength: 4096,
        publicKeyEncoding: {
            type: "pkcs1",
            format: "pem",
        },
        privateKeyEncoding: {
            type: "pkcs1",
            format: "pem",
        },
    });

    const createdUser = await prisma.user.create({
        data: {
            username: username,
            email: email,
            password: hashedPassword,
            privateKey: keyPair.privateKey,
            publicKey: {
                create: {
                    key: keyPair.publicKey,
                }
            }
        },
        omit: {
            privateKey: true,
            password: true,
            created_at: true,
            updated_at: true,
            last_seen: true,
            isOnline: true,
            emailVerifiedAt: true
        }
    })

    res.status(200).json({ succss: true, data: createdUser, error: null })
})

app.post('/user/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).send({
            "data": null,
            "error": "email and password are required",
            "success": false
        })
    }

    const user = await prisma.user.findUnique({ where: { email: email } });
    if (!user) {
        return res.status(404).send({
            "data": null,
            "error": "user not find with that email",
            "success": false
        })
    }

    const passwordMatch = await bcrypt.compare(password, user.password)
    if (!passwordMatch) {
        return res.status(401).send({
            "data": null,
            "error": "password incorrect",
            "success": false
        })
    }

    const jwt_secret = process.env.JWT_SECRET
    const token = jwt.sign({ userId: user.id }, jwt_secret)
    res.status(200).send({
        "success": true,
        "data": {
            "token": token,
            userId: user.id
        }
    })
})

function middleWare(req, res, next) {
    const authHeader = req.headers['authorization']
    if (!authHeader) {
        return res.status(400).send({
            "success": false,
            "data": null,
            "error": "token was not provided"
        })
    }

    const jwt_secret = process.env.JWT_SECRET;
    try {
        const verified = jwt.verify(authHeader, jwt_secret);
        req.user = verified;
        next();
    } catch (err) {
        res.status(401).send({
            "success": false,
            "data": null,
            "error": "token is not valid"
        })
    }

}

app.use(middleWare)

app.get('/user/search', async (req, res) => {
    const { email, username } = req.query;

    console.log(req.user)

    if (!email && !username) {
        res.status(400).send({
            "success": false,
            "data": null,
            "error": "search parameters are required"
        })
    }

    const filteredResponse = await prisma.user.findMany({
        where: {
            OR: [
                {
                    email: {
                        startsWith: email
                    }
                },
                {
                    username: {
                        startsWith: username
                    }
                }
            ],
            NOT: {
                id: req.user.userId
            },

        },
        omit: {
            privateKey: true,
            password: true,
            created_at: true,
            updated_at: true,
            last_seen: true,
            isOnline: true,
            emailVerifiedAt: true
        }
    })

    res.status(200).send({
        "success": true,
        "data": filteredResponse,
        "error": null
    })
})

// create chat
app.post('/chat/create', async (req, res) => {
    const { userIds, name, isGroup } = req.body;
    const currentUserId = req.user.userId;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
        return res.status(400).send({
            "success": false,
            "data": null,
            "error": "userIds (array) is required"
        });
    }

    try {
        const chat = await prisma.chat.create({
            data: {
                name: name || null,
                isGroup: isGroup || userIds.length > 1,
                users: {
                    create: [
                        { userId: currentUserId },
                        ...userIds.map(id => ({ userId: id }))
                    ]
                },
                adminUsers: {
                    connect: [{ id: currentUserId }]
                }
            },
            include: {
                users: {
                    include: {
                        user: {
                            omit: {
                                privateKey: true,
                                password: true,
                                created_at: true,
                                updated_at: true,
                                last_seen: true,
                                isOnline: true,
                                emailVerifiedAt: true
                            }
                        }
                    }
                },
                adminUsers: {
                    omit: {
                        privateKey: true,
                        password: true,
                        created_at: true,
                        updated_at: true,
                        last_seen: true,
                        isOnline: true,
                        emailVerifiedAt: true
                    }
                }
            }
        });

        res.status(200).send({
            "success": true,
            "data": chat,
            "error": null
        });
    } catch (error) {
        console.error("Error creating chat:", error);
        res.status(500).send({
            "success": false,
            "data": null,
            "error": "An error occurred while creating the chat"
        });
    }
});

// block chat
app.post('/chat/block', async (req, res) => {
    const { chatId } = req.body;
    const currentUserId = req.user.userId;

    if (!chatId) {
        return res.status(400).send({
            "success": false,
            "data": null,
            "error": "chatId is required"
        });
    }

    try {
        const chat = await prisma.chat.findFirst({
            where: {
                id: chatId,
                adminUsers: {
                    some: {
                        id: currentUserId
                    }
                },
                users: {
                    some: {
                        userId: currentUserId
                    }
                }
            }
        });

        if (!chat) {
            return res.status(403).send({
                "success": false,
                "data": null,
                "error": "You are not an admin of this chat, not a member, or chat not found"
            });
        }

        const updatedChat = await prisma.chat.update({
            where: { id: chatId },
            data: { chatStatus: 'LOCKED' }
        });

        res.status(200).send({
            "success": true,
            "data": updatedChat,
            "error": null
        });
    } catch (error) {
        console.error("Error blocking chat:", error);
        res.status(500).send({
            "success": false,
            "data": null,
            "error": "An error occurred while blocking the chat"
        });
    }
});

// remove user from chat
app.post('/chat/remove-user', async (req, res) => {
    const { chatId, userId } = req.body;
    const currentUserId = req.user.userId;

    if (!chatId || !userId) {
        return res.status(400).send({
            "success": false,
            "data": null,
            "error": "chatId and userId are required"
        });
    }

    try {
        const chat = await prisma.chat.findFirst({
            where: {
                id: chatId,
                adminUsers: {
                    some: {
                        id: currentUserId
                    }
                },
                users: {
                    some: {
                        userId: currentUserId
                    }
                }
            }
        });

        if (!chat) {
            return res.status(403).send({
                "success": false,
                "data": null,
                "error": "You are not an admin of this chat, not a member, or chat not found"
            });
        }

        await prisma.chatUser.delete({
            where: {
                chatId_userId: {
                    chatId: chatId,
                    userId: userId
                }
            }
        });

        res.status(200).send({
            "success": true,
            "data": null,
            "error": null,
            "message": "User removed from chat successfully"
        });
    } catch (error) {
        console.error("Error removing user from chat:", error);
        res.status(500).send({
            "success": false,
            "data": null,
            "error": "An error occurred while removing the user from the chat"
        });
    }
});

// leave chat
app.post('/chat/leave-chat', async (req, res) => {
    const { chatId } = req.body;
    const currentUserId = req.user.userId;

    if (!chatId) {
        return res.status(400).send({
            "success": false,
            "data": null,
            "error": "chatId is required"
        });
    }

    try {
        const chat = await prisma.chat.findUnique({
            where: { id: chatId },
            include: {
                users: true,
                adminUsers: true
            }
        });

        if (!chat) {
            return res.status(404).send({
                "success": false,
                "data": null,
                "error": "Chat not found"
            });
        }

        const isParticipant = chat.users.some(u => u.userId === currentUserId);
        if (!isParticipant) {
            return res.status(403).send({
                "success": false,
                "data": null,
                "error": "You are not a member of this chat"
            });
        }

        const isAdmin = chat.adminUsers.some(u => u.id === currentUserId);
        const otherParticipants = chat.users.filter(u => u.userId !== currentUserId);

        await prisma.$transaction(async (tx) => {
            if (isAdmin && otherParticipants.length > 0) {
                // Elevate all other participants to admin
                await tx.chat.update({
                    where: { id: chatId },
                    data: {
                        adminUsers: {
                            connect: otherParticipants.map(u => ({ id: u.userId })),
                            disconnect: [{ id: currentUserId }]
                        }
                    }
                });
            } else if (isAdmin) {
                // If last member and admin, just disconnect
                await tx.chat.update({
                    where: { id: chatId },
                    data: {
                        adminUsers: {
                            disconnect: [{ id: currentUserId }]
                        }
                    }
                });
            }

            // Remove participant record
            await tx.chatUser.delete({
                where: {
                    chatId_userId: {
                        chatId: chatId,
                        userId: currentUserId
                    }
                }
            });
        });

        res.status(200).send({
            "success": true,
            "data": null,
            "error": null,
            "message": "You have left the chat successfully"
        });
    } catch (error) {
        console.error("Error leaving chat:", error);
        res.status(500).send({
            "success": false,
            "data": null,
            "error": "An error occurred while leaving the chat"
        });
    }
});

// send message
app.post('/chat/send-message', upload.single('attachment'), async (req, res) => {
    const { chatId, text } = req.body;
    const currentUserId = req.user.userId;
    const file = req.file;

    if (!chatId) {
        return res.status(400).send({
            "success": false,
            "data": null,
            "error": "chatId is required"
        });
    }

    if (!text && !file) {
        return res.status(400).send({
            "success": false,
            "data": null,
            "error": "Message text or attachment is required"
        });
    }

    try {
        const chat = await prisma.chat.findUnique({
            where: { id: chatId },
            include: { users: true }
        });

        if (!chat) {
            return res.status(404).send({
                "success": false,
                "data": null,
                "error": "Chat not found"
            });
        }

        const isParticipant = chat.users.some(u => u.userId === currentUserId);
        if (!isParticipant) {
            return res.status(403).send({
                "success": false,
                "data": null,
                "error": "You are not a member of this chat"
            });
        }

        let encryptedText = null;
        if (text) {
            const user = await prisma.user.findUnique({ where: { id: currentUserId } });
            if (!user || !user.privateKey) {
                return res.status(500).send({
                    "success": false,
                    "data": null,
                    "error": "User private key not found for encryption"
                });
            }

            // Encrypt using private key as requested
            const buffer = Buffer.from(text, 'utf-8');
            const encrypted = crypto.privateEncrypt(user.privateKey, buffer);
            encryptedText = encrypted.toString('base64');
        }

        const messageData = {
            chat_id: chatId,
            sender_id: currentUserId,
            text: encryptedText,
            blob_location: file ? file.key : null,
            type: file ? (file.mimetype.includes('audio') ? 'VOICENOTE' : (file.mimetype.includes('pdf') ? 'PDF' : 'TEXT')) : 'TEXT'
        };

        const createdMessage = await prisma.$transaction(async (tx) => {
            const msg = await tx.message.create({
                data: messageData
            });

            // Create metadata for all participants
            const metadataPromises = chat.users.map(u => {
                return tx.userMessageMetadata.create({
                    data: {
                        messageId: msg.id,
                        userId: u.userId,
                        status: u.userId === currentUserId ? 'READ' : 'UNREAD',
                        seenAt: u.userId === currentUserId ? new Date() : null
                    }
                });
            });

            await Promise.all(metadataPromises);
            return msg;
        });

        res.status(200).send({
            "success": true,
            "data": createdMessage,
            "error": null
        });

    } catch (error) {
        console.error("Error sending message:", error);
        res.status(500).send({
            "success": false,
            "data": null,
            "error": "An error occurred while sending the message"
        });
    }
});

// get messages
app.get('/chat/get-messages', async (req, res) => {
    const { chatId, limit = 20, offset = 0 } = req.query;
    const currentUserId = req.user.userId;

    if (!chatId) {
        return res.status(400).send({
            "success": false,
            "data": null,
            "error": "chatId is required"
        });
    }

    try {
        const chat = await prisma.chat.findUnique({
            where: { id: chatId },
            include: { users: true }
        });

        if (!chat) {
            return res.status(404).send({
                "success": false,
                "data": null,
                "error": "Chat not found"
            });
        }

        const isParticipant = chat.users.some(u => u.userId === currentUserId);
        if (!isParticipant) {
            return res.status(403).send({
                "success": false,
                "data": null,
                "error": "You are not a member of this chat"
            });
        }

        const messages = await prisma.message.findMany({
            where: { chat_id: chatId },
            take: parseInt(limit),
            skip: parseInt(offset),
            orderBy: { created_at: 'desc' },
            include: {
                sender: {
                    include: {
                        publicKey: true
                    }
                }
            }
        });

        const processedMessages = await Promise.all(messages.map(async (msg) => {
            let decryptedText = null;
            if (msg.text) {
                try {
                    const publicKey = msg.sender.publicKey?.key;
                    if (publicKey) {
                        const buffer = Buffer.from(msg.text, 'base64');
                        const decrypted = crypto.publicDecrypt(publicKey, buffer);
                        decryptedText = decrypted.toString('utf-8');
                    }
                } catch (err) {
                    console.error("Decryption error for message:", msg.id, err);
                }
            }

            let attachmentUrl = null;
            if (msg.blob_location) {
                const command = new GetObjectCommand({
                    Bucket: process.env.S3_BUCKET_NAME,
                    Key: msg.blob_location,
                });
                attachmentUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });
            }

            return {
                ...msg,
                text: decryptedText || msg.text,
                attachmentUrl: attachmentUrl
            };
        }));

        res.status(200).send({
            "success": true,
            "data": processedMessages,
            "error": null
        });

    } catch (error) {
        console.error("Error fetching messages:", error);
        res.status(500).send({
            "success": false,
            "data": null,
            "error": "An error occurred while fetching messages"
        });
    }
});

const PORT = process.env.PORT;
app.listen(PORT, () => {
    console.log(`Server running on port http://localhost:${PORT}`)
})