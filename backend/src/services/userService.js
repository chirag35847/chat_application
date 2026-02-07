import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { userRepository } from '../repositories/userRepository.js';
import { generateRSAKeyPair } from '../utils/crypto.js';
import { redisHelpers } from '../redis/helpers.js';
import { REDIS_KEYS } from '../redis/keys.js';

export const userService = {
    async registerUser({ email, username, password }) {
        const hashedPassword = await bcrypt.hash(password, 10);
        const keyPair = generateRSAKeyPair();

        const user = await userRepository.createUser({
            username,
            email,
            hashedPassword,
            privateKey: keyPair.privateKey,
            publicKey: keyPair.publicKey
        });

        const accessToken = this.generateAccessToken(user.id);
        const refreshToken = this.generateRefreshToken(user.id);

        // Store refresh token in Redis with 7 days expiry
        await redisHelpers.setCache(REDIS_KEYS.REFRESH_TOKEN(user.id), refreshToken, 7 * 24 * 60 * 60);

        return {
            accessToken,
            refreshToken,
            userId: user.id,
        };
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

        const accessToken = this.generateAccessToken(user.id);
        const refreshToken = this.generateRefreshToken(user.id);

        // Store refresh token in Redis with 7 days expiry
        await redisHelpers.setCache(REDIS_KEYS.REFRESH_TOKEN(user.id), refreshToken, 7 * 24 * 60 * 60);


        return {
            accessToken,
            refreshToken,
            userId: user.id,
        };
    },

    generateAccessToken(userId) {
        return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '15m' });
    },

    generateRefreshToken(userId) {
        return jwt.sign({ userId }, process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET, { expiresIn: '7d' });
    },

    async refreshAccessToken(refreshToken) {
        try {
            const secret = process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET;
            const decoded = jwt.verify(refreshToken, secret);

            const storedToken = await redisHelpers.getCache(REDIS_KEYS.REFRESH_TOKEN(decoded.userId));

            if (!storedToken || storedToken !== refreshToken) {
                throw new Error('Invalid refresh token');
            }

            const accessToken = this.generateAccessToken(decoded.userId);
            return { accessToken };
        } catch (error) {
            throw new Error('Invalid or expired refresh token');
        }
    },

    async logout(userId) {
        await redisHelpers.delCache(REDIS_KEYS.REFRESH_TOKEN(userId));
    },

    async searchUsers(query, excludeUserId) {
        return await userRepository.searchUsers(query, excludeUserId);
    }
};
