export const REDIS_KEYS = {
    PRESIGNED_URL: (fileKey) => `presigned_url:${fileKey}`,
    RATE_LIMIT: (identifier) => `rate_limit:${identifier}`,
    REFRESH_TOKEN: (userId) => `refresh_token:${userId}`,
};

