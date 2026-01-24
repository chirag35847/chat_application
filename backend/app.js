import express from 'express';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { v4 } from 'uuid';

dotenv.config();

const app = express();
app.use(express.json());

app.get("/", (req, res) => {
    res.send("I am up") 
})

app.post("/user/register", (req, res) => {
    const body = req.body;
    const {email, username, password} = body;

    if(!email || !username || !password) {
        res.status(400).json({"error": "either of email, username or password was not provided"})
    }

    const hashedPassword = bcrypt.hash(password, 10);
    const user = {
        id: v4(),
        name: username,
        email: email,
        password: hashedPassword,
        createdAt: Math.floor((new Date()).getTime() / 1000),
        updatedAt: Math.floor((new Date()).getTime() / 1000),
        LastSeen: null,
        privateKey: null,
    }

    res.status(200).json({succss:true, data: user, error: null})
})

const PORT = process.env.PORT;
app.listen(PORT, () => {
    console.log(`Server running on port http://localhost:${PORT}`)
})