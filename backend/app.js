import express from 'express';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { v4 } from 'uuid';
import { prisma } from './lib/prisma.js'
import crypto from 'crypto'
import jwt from 'jsonwebtoken'

dotenv.config();

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
        const blockedUser = await prisma.blockedUser.findUnique({
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

    // console.log(req.user.userId)
    // const chat = await prisma.chat.findUnique({
    //     where: {
    //         id: chatId,
    //         adminUsers: {
    //             some: {
    //                 id: req.user.userId
    //             }
    //         },
    //         users: {
    //             some: {
    //                 userId: req.user.userId
    //             }
    //         }
    //     }
    // })

    // console.log(chat)

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

const PORT = process.env.PORT;
app.listen(PORT, () => {
    console.log(`Server running on port http://localhost:${PORT}`)
})