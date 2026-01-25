export const REDIS_KEYS = {
    PRESIGNED_URL: (fileKey) => `presigned_url:${fileKey}`,
    RATE_LIMIT: (identifier) => `rate_limit:${identifier}`,
};
