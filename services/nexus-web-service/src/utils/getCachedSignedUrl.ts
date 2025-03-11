import {
    GoogleCloudStorageSingleton,
    RedisClientSingleton,
} from 'third-party-clients';

import { SIGNED_URL_EXPIRATION_SECONDS } from '../constants';

export const getCachedSignedUrl = async (
    bucket: string,
    filePath: string
): Promise<string> => {
    const cacheKey = `signed_url:${filePath}`;

    // Step 1: Check Redis cache
    let cachedUrl = await RedisClientSingleton.getInstance().get(cacheKey);

    if (cachedUrl) {
        return cachedUrl as string;
    }
    const [signedUrl] = await GoogleCloudStorageSingleton.getInstance()
        .bucket(bucket)
        .file(filePath)
        .getSignedUrl({
            action: 'read',
            expires: Date.now() + SIGNED_URL_EXPIRATION_SECONDS * 1000,
        });

    cachedUrl = signedUrl;

    // Step 3: Cache the URL slightly less than the expiry
    const redisCacheExpiry = SIGNED_URL_EXPIRATION_SECONDS - 600; // cache for expiry minus 10 minutes
    await RedisClientSingleton.getInstance().set(cacheKey, cachedUrl, {
        ex: redisCacheExpiry,
    });

    return cachedUrl as string;
};
