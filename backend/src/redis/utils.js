import { redisClient } from "../config/redis.js";

function setRedis (key, value, ttl = 0) {
    redisClient.set(key, value, {EX: ttl})
}

async function getRedis (key)  {
    return await redisClient.get(key)
}

async function increment(key) {
    return await redisClient.incr(key)
}

export {getRedis, setRedis, increment}