import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { userRepository } from '../repositories/userRepository.js';
import { generateRSAKeyPair } from '../utils/crypto.js';

export const userService = {
    async registerUser({ email, username, password }) {
        const hashedPassword = await bcrypt.hash(password, 10);
        const keyPair = generateRSAKeyPair();

        return await userRepository.createUser({
            username,
            email,
            hashedPassword,
            privateKey: keyPair.privateKey,
            publicKey: keyPair.publicKey
        });
    },

    async loginUser({ email, password }) {
        const user = await userRepository.findByEmail(email);
        if (!user) {
            throw new Error('user not find with that email');
        }

        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            throw new Error('password incorrect');
        }

        const jwt_secret = process.env.JWT_SECRET;
        const token = jwt.sign({ userId: user.id }, jwt_secret);

        return { token, userId: user.id };
    },

    async searchUsers(query, excludeUserId) {
        return await userRepository.searchUsers(query, excludeUserId);
    }
};
