import { SIGNED_URL_EXPIRATION_SECONDS } from '../constants';

import { RedisClientSingleton } from './RedisClientSingleton';
import { SupabaseClientSingleton } from './SupabaseClientSingleton';

export const getCachedSignedUrl = async (
    bucket: string,
    filePath: string
): Promise<string> => {
    const cacheKey = `signed_url:${filePath}`;

    // Step 1: Check Redis cache
    let cachedUrl = await RedisClientSingleton.getInstance().get(cacheKey);

    if (cachedUrl) {
        console.log('Cache HIT:', filePath);
        return cachedUrl as string;
    }

    console.log('Cache MISS:', filePath);

    // Step 2: Fetch new signed URL from Supabase
    const { data, error } = await SupabaseClientSingleton.getInstance()
        .storage.from(bucket) // adjust bucket name
        .createSignedUrl(filePath, SIGNED_URL_EXPIRATION_SECONDS);

    if (error || !data?.signedUrl) {
        console.error('Error generating signed URL:', error);
        throw new Error('Failed to generate signed URL');
    }

    cachedUrl = data.signedUrl;

    // Step 3: Cache the URL slightly less than the expiry
    const redisCacheExpiry = SIGNED_URL_EXPIRATION_SECONDS - 600; // cache for expiry minus 10 minutes
    await RedisClientSingleton.getInstance().set(cacheKey, cachedUrl, {
        ex: redisCacheExpiry,
    });

    return cachedUrl as string;
};
