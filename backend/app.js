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

const PORT = process.env.PORT;
app.listen(PORT, () => {
    console.log(`Server running on port http://localhost:${PORT}`)
})