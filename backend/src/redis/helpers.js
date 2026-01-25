import { redisClient } from '../config/redis.js';

export const redisHelpers = {
    async setCache(key, value, expiryInSeconds = 3600) {
        try {
            await redisClient.set(key, value, {
                EX: expiryInSeconds
            });
        } catch (error) {
            console.error('Redis SetCache Error:', error);
        }
    },

    async getCache(key) {
        try {
            return await redisClient.get(key);
        } catch (error) {
            console.error('Redis GetCache Error:', error);
            return null;
        }
    },

    async delCache(key) {
        try {
            await redisClient.del(key);
        } catch (error) {
            console.error('Redis DelCache Error:', error);
        }
    },

    async incr(key) {
        try {
            return await redisClient.incr(key);
        } catch (error) {
            console.error('Redis Incr Error:', error);
            return null;
        }
    },

    async expire(key, seconds) {
        try {
            await redisClient.expire(key, seconds);
        } catch (error) {
            console.error('Redis Expire Error:', error);
        }
    }
};
