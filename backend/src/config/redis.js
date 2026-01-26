import { createClient } from "redis";
import dotenv from 'dotenv';

dotenv.config()

const redisClient = createClient({
    url: process.env.REDIS_URL
})

const connectRedis = async () => {
    if(!redisClient?.isOpen){
        await redisClient.connect();
        console.log("redis connected")
    }
}

export {redisClient, connectRedis};