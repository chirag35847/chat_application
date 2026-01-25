import { prisma } from '../config/prisma.js';

export const userRepository = {
    async createUser({ username, email, hashedPassword, privateKey, publicKey }) {
        return await prisma.user.create({
            data: {
                username,
                email,
                password: hashedPassword,
                privateKey,
                publicKey: {
                    create: {
                        key: publicKey,
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
        });
    },

    async findByEmail(email) {
        return await prisma.user.findUnique({ where: { email } });
    },

    async findById(id, selectFields = {}) {
        const query = { where: { id } };
        if (Object.keys(selectFields).length > 0) {
            query.select = selectFields;
        }
        return await prisma.user.findUnique(query);
    },

    async searchUsers(query, excludeUserId) {
        const { email, username } = query;
        return await prisma.user.findMany({
            where: {
                OR: [
                    { email: { startsWith: email } },
                    { username: { startsWith: username } }
                ],
                NOT: { id: excludeUserId },
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
        });
    }
};
