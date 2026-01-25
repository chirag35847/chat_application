import express from 'express';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { v4 } from 'uuid';
import { prisma } from './lib/prisma.js'
import crypto from 'crypto'
import jwt from 'jsonwebtoken'
import { S3Client, CreateBucketCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import multer from 'multer';
import multerS3 from 'multer-s3';

dotenv.config();

const s3Endpoint = process.env.S3_ENDPOINT
const awsAccessKeyId = process.env.AWS_ACCESS_KEY
const awsSecretKey = process.env.AWS_SECRET_KEY
const s3Region = process.env.S3_REGION
const s3BucketName = process.env.S3_BUCKET_NAME
const s3 = new S3Client({
    endpoint: s3Endpoint,
    credentials: {
        accessKeyId: awsAccessKeyId,
        secretAccessKey: awsSecretKey,
    },
    region: s3Region,
    forcePathStyle: true,
})

try {
    const command = new CreateBucketCommand({
        Bucket: s3BucketName,
    });

    await s3.send(command)
} catch (_) { }

const upload = multer({
    storage: multerS3({
        s3: s3,
        bucket: s3BucketName,
        metadata: function (req, file, cb) {
            cb(null, { fieldName: file.fieldname });
        },
        key: function (req, file, cb) {
            cb(null, `${v4()}-${Date.now().toString()}`)
        }
    }),
    fileFilter: (req, file, cb) => {
        const allowedMimes = ['application/pdf', 'text/plain'];
        if (allowedMimes.includes(file.mimetype) || file.mimetype.startsWith('audio/')) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only PDF, Audio, and Text files are allowed.'), false);
        }
    }
})

const app = express();
app.use(express.json());

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

app.post('/chat', async (req, res) => {
    const { userIds, name } = req.body;
    const loggedInUserId = req.user.userId;


    if (!userIds || !Array.isArray(userIds) || userIds.length == 0) {
        return res.status(400).send({
            "success": false,
            "data": null,
            "error": "no users to create the chat with"
        })
    }

    const isGroupChat = userIds.length > 1;
    if (isGroupChat && !name) {
        return res.status(400).send({
            "success": false,
            "data": null,
            "error": "chat name is required in case of group chat"
        })
    }

    if (isGroupChat) {
        const blockedUser = await prisma.blockedUser.findFirst({
            where: {
                OR: [
                    {
                        blockedId: req.user.userId,
                        blockerId: userIds[0],
                    },
                    {
                        blockerId: req.user.userId,
                        blockedId: userIds[0],
                    }
                ]
            }
        })

        if (blockedUser) {
            const errorMessage = "you have blocked the other user"
            if (blockedUser.blockerId == req.user.userId) {
                errorMessage = "you were blocked by the other user"
            }

            return res.status(400).send({
                "success": false,
                "data": null,
                "error": errorMessage
            })
        }
    }

    const chat = await prisma.chat.create({
        data: {
            name: name || null,
            isGroup: isGroupChat,
            users: {
                create: [
                    { userId: loggedInUserId },
                    ...userIds.map((id) => {
                        return {
                            userId: id
                        }
                    })
                ]
            },
            adminUsers: {
                connect: {
                    id: loggedInUserId
                }
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
    })

    return res.status(200).send({
        data: chat,
        error: null,
        success: true
    })
})

app.post('/chat/block', async (req, res) => {
    const { chatId } = req.body;
    if (!chatId) {
        res.status(400).send({
            data: null,
            error: "chatId is a mandatory field",
            success: false
        })
    }

    const chat = await prisma.chat.findUnique({
        where: {
            id: chatId,
            adminUsers: {
                some: {
                    id: req.user.userId
                }
            },
            users: {
                some: {
                    userId: req.user.userId
                }
            }
        }
    })

    if (!chat) {
        res.status(404).send({
            data: null,
            error: "No chat found",
            success: false
        })
    }

    const updatedChat = await prisma.chat.update({
        where: {
            id: chatId,
        },
        data: {
            chatStatus: "LOCKED"
        },
        include: {
            users: true,
        }
    })

    if (!updatedChat.isGroup) {

        const otherUserId = updatedChat.users.filter(id => id.userId != req.user.userId)

        console.log(req.user.userId)
        console.log(otherUserId[0].userId)

        const blockedUser = await prisma.blockedUser.create({
            data: {
                blocker: {
                    connect: {
                        id: req.user.userId
                    }
                },
                blocked: {
                    connect: {
                        id: otherUserId[0].userId
                    }
                }
            }
        })
    }

    res.status(200).send({
        success: true,
        data: null,
        error: null
    })
})

app.post('/chat/message', upload.single('attachment'), async (req, res) => {
    try {
        console.log("Request Body:", req.body);
        console.log("Request File:", req.file);

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

        const chat = await prisma.chat.findUnique({
            where: {
                id: chatId,
                users: {
                    some: {
                        userId: userId
                    }
                }
            }
        });

        if (!chat) {
            return res.status(404).json({
                success: false,
                data: null,
                error: "Chat not found or you are not a member"
            });
        }

        if (chat.chatStatus === "LOCKED") {
            return res.status(403).json({
                success: false,
                data: null,
                error: "This chat is locked"
            });
        }

        let encryptedText = null;
        let blobLocation = null;

        if (text) {
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { privateKey: true }
            });

            if (!user || !user.privateKey) {
                return res.status(404).json({
                    success: false,
                    data: null,
                    error: "User private key not found"
                });
            }

            try {
                const buffer = Buffer.from(text, 'utf8');
                encryptedText = crypto.privateEncrypt(user.privateKey, buffer).toString('base64');
            } catch (encryptionError) {
                return res.status(400).json({
                    success: false,
                    data: null,
                    error: "Encryption failed. Message might be too long for the RSA key size."
                });
            }
        }

        if (req.file) {
            blobLocation = req.file.key;
        }

        if (!text && !req.file) {
            return res.status(400).json({
                success: false,
                data: null,
                error: "Either text or an attachment must be provided"
            });
        }

        // Determine message type based on file
        let messageType = 'TEXT';
        if (req.file) {
            if (req.file.mimetype === 'application/pdf') {
                messageType = 'PDF';
            } else if (req.file.mimetype.startsWith('audio/')) {
                messageType = 'VOICENOTE';
            }
        }

        // Force to valid enum strictly just in case
        const validTypes = ['TEXT', 'VOICENOTE', 'PDF'];
        if (!validTypes.includes(messageType)) {
            messageType = 'TEXT';
        }

        const message = await prisma.message.create({
            data: {
                text: encryptedText,
                blob_location: blobLocation,
                chat_id: chatId,
                sender_id: userId,
                type: messageType
            }
        });

        // Fetch sender separately if needed to be safe
        const messageWithSender = await prisma.message.findUnique({
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

        return res.status(200).json({
            success: true,
            data: messageWithSender,
            error: null
        });

    } catch (error) {
        console.error("Error sending message:", error);
        return res.status(500).json({
            success: false,
            data: null,
            error: "An internal server error occurred"
        });
    }
})


app.get('/chat/message', async (req, res) => {
    try {
        const { chatId, limit = '20', offset = '0' } = req.query;
        const userId = req.user.userId;

        if (!chatId) {
            return res.status(400).json({
                success: false,
                data: null,
                error: "chatId is required"
            });
        }

        // Verify user is member of chat
        const userInChat = await prisma.chatUser.findUnique({
            where: {
                chatId_userId: {
                    chatId: chatId,
                    userId: userId
                }
            }
        });

        if (!userInChat) {
            return res.status(403).json({
                success: false,
                data: null,
                error: "You are not a member of this chat"
            });
        }

        const take = Math.max(1, parseInt(limit) || 20);
        const skip = Math.max(0, parseInt(offset) || 0);

        const messages = await prisma.message.findMany({
            where: {
                chat_id: chatId
            },
            take,
            skip,
            orderBy: {
                created_at: 'desc'
            },
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

        const messagesWithData = await Promise.all(messages.map(async (msg) => {
            let decryptedText = null;
            let presignedUrl = null;

            // Decrypt text if exists
            if (msg.text && msg.sender.publicKey) {
                try {
                    const publicKey = msg.sender.publicKey.key;
                    decryptedText = crypto.publicDecrypt(publicKey, Buffer.from(msg.text, 'base64')).toString('utf8');
                } catch (err) {
                    console.error(`Failed to decrypt message ${msg.id}:`, err);
                    decryptedText = "[Error Decrypting Message]";
                }
            }

            // Generate presigned URL for blob if exists
            if (msg.blob_location) {
                try {
                    const command = new GetObjectCommand({
                        Bucket: s3BucketName,
                        Key: msg.blob_location
                    });
                    presignedUrl = await getSignedUrl(s3, command, { expiresIn: 3600 }); // URL valid for 1 hour
                } catch (err) {
                    console.error(`Failed to generate presigned URL for message ${msg.id}:`, err);
                }
            }

            delete msg.sender.publicKey;
            delete msg.sender_id;
            delete msg.chat_id;

            return {
                ...msg,
                text: decryptedText || msg.text, // Fallback to original text if decryption failed but didn't throw (unlikely)
                presignedUrl: presignedUrl
            };
        }));

        return res.status(200).json({
            success: true,
            data: messagesWithData,
            error: null
        });

    } catch (error) {
        console.error("Error fetching messages:", error);
        return res.status(500).json({
            success: false,
            data: null,
            error: "An internal server error occurred"
        });
    }
});

app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError || err.message.includes('Invalid file type')) {
        return res.status(400).json({
            success: false,
            data: null,
            error: err.message
        });
    }
    res.status(500).json({
        success: false,
        data: null,
        error: "An internal server error occurred"
    });
});

const PORT = process.env.PORT;
app.listen(PORT, () => {
    console.log(`Server running on port http://localhost:${PORT}`)
})