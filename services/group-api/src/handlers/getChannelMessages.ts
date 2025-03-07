import { Request, Response } from 'express';
import {
    GroupChannelMessageEntity,
    GetChannelMessagesParams,
    GetChannelMessagesQueryParams,
} from 'group-api-client';
import { initializeDataSource } from '../database';
import { RedisClientSingleton } from '../utils';
import { REDIS_EXPIRATION_SECONDS } from '../constants';

export const getChannelMessages = async (
    req: Request<
        GetChannelMessagesParams,
        unknown,
        unknown,
        GetChannelMessagesQueryParams
    >,
    res: Response
) => {
    try {
        const { channelId } = req.params;
        const { offset: offsetQuery } = req.query;
        const offset = Number.parseInt(offsetQuery || '0', 10);
        const limit = 100;

        if (!channelId) {
            res.status(400).send('Channel ID parameter is missing');
            return;
        }
        const cacheKey = `messages:${channelId}-${offset}-${limit}`;
        // Step 1: Check Redis cache
        let cachedMessages =
            await RedisClientSingleton.getInstance().get(cacheKey);

        if (!cachedMessages) {
            const dataSource = await initializeDataSource();

            // Fetch messages for the channel.
            const messages = await dataSource.manager
                .createQueryBuilder(GroupChannelMessageEntity, 'message')
                .where('message.channelId = :channelId', { channelId })
                .orderBy('message.postedAt', 'DESC')
                .skip(offset)
                .take(limit)
                .getMany();

            cachedMessages = messages;
            await RedisClientSingleton.getInstance().set(
                cacheKey,
                cachedMessages,
                { ex: REDIS_EXPIRATION_SECONDS }
            );
        }

        res.status(200).json(cachedMessages);
    } catch (error) {
        res.status(500).send((error as Error).message);
    }
};
