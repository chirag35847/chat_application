import { prisma } from '../config/prisma.js';

export const chatRepository = {
    async findChatByIdAndUser(chatId, userId, isAdmin = false) {
        const where = {
            id: chatId,
            users: {
                some: {
                    userId: userId
                }
            }
        };

        if (isAdmin) {
            where.adminUsers = {
                some: {
                    id: userId
                }
            };
        }

        return await prisma.chat.findUnique({
            where: where
        });
    },

    async createChat({ name, isGroup, userIds, adminUserId }) {
        return await prisma.chat.create({
            data: {
                name: name || null,
                isGroup,
                users: {
                    create: [
                        { userId: adminUserId },
                        ...userIds.map((id) => ({ userId: id }))
                    ]
                },
                adminUsers: {
                    connect: {
                        id: adminUserId
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
        });
    },

    async updateChatStatus(chatId, status) {
        return await prisma.chat.update({
            where: { id: chatId },
            data: { chatStatus: status },
            include: { users: true }
        });
    },

    async isUserBlocked(userId, otherUserId) {
        return await prisma.blockedUser.findFirst({
            where: {
                OR: [
                    { blockedId: userId, blockerId: otherUserId },
                    { blockerId: userId, blockedId: otherUserId }
                ]
            }
        });
    },

    async blockUser(blockerId, blockedId) {
        return await prisma.blockedUser.create({
            data: {
                blocker: { connect: { id: blockerId } },
                blocked: { connect: { id: blockedId } }
            }
        });
    },

    async isUserInChat(chatId, userId) {
        return await prisma.chatUser.findUnique({
            where: {
                chatId_userId: {
                    chatId: chatId,
                    userId: userId
                }
            }
        });
    },

    async findUserChats(userId) {
        return await prisma.chat.findMany({
            where: {
                users: {
                    some: {
                        userId: userId
                    }
                }
            },
            include: {
                users: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                username: true,
                                email: true,
                                isOnline: true,
                                last_seen: true
                            }
                        }
                    }
                },
                messages: {
                    orderBy: {
                        created_at: 'desc'
                    },
                    take: 1,
                    include: {
                        sender: {
                            select: {
                                username: true,
                                publicKey: {
                                    select: {
                                        key: true
                                    }
                                }
                            }
                        }
                    }
                }
            },
            orderBy: {
                updated_at: 'desc'
            }
        });
    }
};
