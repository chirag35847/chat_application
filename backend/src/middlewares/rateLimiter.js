import { REDIS_KEYS } from "../redis/constants.js"
import { getRedis, setRedis, increment } from "../redis/utils.js"

export const rateLimiter = async (req,res,next) => {
    const numberOfRequestsSupported = 100
    const time = 60
    const identifier = req?.ip || req?.user?.userId || req?.socket?.remoteAddress
    const redisKey = REDIS_KEYS.RATE_LIMITER(identifier)

    const cachedValue = await getRedis(redisKey)
    if (!cachedValue) {
        setRedis(redisKey, 1, time)
    } else {
        const numberOfRequestsAlreadyMade = parseInt(cachedValue) 
        if(numberOfRequestsAlreadyMade < numberOfRequestsSupported){
            await increment(redisKey)
        } else {
            return res.status(429).send({
                data: null,
                error: "too many requests",
                success: false
            })
        }
    }

    next()
}