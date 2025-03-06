import { Redis } from '@upstash/redis';
import { UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN } from '../config';

export const RedisClientSingleton = (function () {
    let redis: Redis | undefined;

    return {
        getInstance() {
            if (!redis) {
                redis = new Redis({
                    url: UPSTASH_REDIS_REST_URL,
                    token: UPSTASH_REDIS_REST_TOKEN,
                });
            }
            return redis;
        },
    };
})();
