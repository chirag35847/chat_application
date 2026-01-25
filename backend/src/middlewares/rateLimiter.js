import { redisHelpers } from '../redis/helpers.js';
import { REDIS_KEYS } from '../redis/keys.js';

export const rateLimiter = (limit = 100, windowInSeconds = 60) => {
    return async (req, res, next) => {
        const identifier = req.user?.userId || req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        const key = REDIS_KEYS.RATE_LIMIT(identifier);

        try {
            const currentRequests = await redisHelpers.incr(key);

            if (currentRequests === 1) {
                await redisHelpers.expire(key, windowInSeconds);
            }

            if (currentRequests > limit) {
                return res.status(429).json({
                    success: false,
                    data: null,
                    error: "Too many requests. Please try again later.",
                    retryAfter: `${windowInSeconds}s`
                });
            }

            console.log('Rate Limit:', currentRequests);

            res.set('X-RateLimit-Limit', limit);
            res.set('X-RateLimit-Remaining', Math.max(0, limit - currentRequests));

            next();
        } catch (error) {
            console.error('Rate Limiter Error:', error);
            next();
        }
    };
};
