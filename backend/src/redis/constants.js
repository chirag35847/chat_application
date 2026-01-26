export const REDIS_KEYS = {
    PRESIGNED_URL: (messageId) => `presigned_url_${messageId}`,
    RATE_LIMITER: (identifier) => `rate_limit_${identifier}`
}