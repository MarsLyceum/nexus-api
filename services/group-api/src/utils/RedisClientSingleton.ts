import { Redis } from '@upstash/redis';

export const RedisClientSingleton = (function () {
    let redis: Redis | undefined;

    return {
        getInstance() {
            if (!redis) {
                redis = new Redis({
                    url: process.env.UPSTASH_REDIS_REST_URL,
                    token: process.env.UPSTASH_REDIS_REST_TOKEN,
                });
            }
            return redis;
        },
    };
})();
