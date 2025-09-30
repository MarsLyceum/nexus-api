import { Redis } from '@upstash/redis';
import { UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN } from './config';

export const RedisClientSingleton = (function () {
    let redis: Redis | undefined;
    let isDisabled = false;

    return {
        getInstance() {
            if (isDisabled) {
                return createNoOpRedis();
            }

            if (!redis) {
                if (!UPSTASH_REDIS_REST_URL || !UPSTASH_REDIS_REST_TOKEN) {
                    console.warn(
                        '[Redis] Missing UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN. Redis caching is disabled.'
                    );
                    isDisabled = true;
                    return createNoOpRedis();
                }

                redis = new Redis({
                    url: UPSTASH_REDIS_REST_URL,
                    token: UPSTASH_REDIS_REST_TOKEN,
                });
            }
            return redis;
        },
    };
})();

const createNoOpRedis = (): Redis => {
    const noop = async () => undefined;
    return {
        get: noop,
        set: noop,
        del: noop,
        exists: noop,
        expire: noop,
        ttl: noop,
        keys: noop,
        scan: noop,
        incr: noop,
        decr: noop,
        lpush: noop,
        rpush: noop,
        lpop: noop,
        rpop: noop,
        lrange: noop,
        llen: noop,
        sadd: noop,
        srem: noop,
        smembers: noop,
        sismember: noop,
        zadd: noop,
        zrange: noop,
        zrem: noop,
        zcard: noop,
    } as unknown as Redis;
};
