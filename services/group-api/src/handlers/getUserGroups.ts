// handlers.ts

import { Request, Response } from 'express';
import { GroupEntity, GetUserGroupsParams } from 'group-api-client';
import {
    RedisClientSingleton,
    TypeOrmDataSourceSingleton,
} from 'third-party-clients';
import { REDIS_EXPIRATION_SECONDS } from '../constants';

export const getUserGroups = async (
    req: Request<GetUserGroupsParams>,
    res: Response
) => {
    try {
        const { userId } = req.params;
        if (!userId) {
            res.status(400).send('User ID parameter is missing');
            return;
        }
        const cacheKey = `user_groups:${userId}`;
        // Step 1: Check Redis cache
        let cachedUserGroups;
        try {
            cachedUserGroups =
                await RedisClientSingleton.getInstance().get(cacheKey);
        } catch (error) {
            console.error('[Redis] Error fetching from cache:', error);
        }

        if (!cachedUserGroups) {
            const dataSource = await TypeOrmDataSourceSingleton.getInstance();

            const groups = await dataSource.manager
                .createQueryBuilder(GroupEntity, 'group')
                .innerJoinAndSelect('group.members', 'member')
                .leftJoinAndSelect('group.channels', 'channel')
                .where('member.userId = :userId', { userId })
                .orderBy('channel.orderIndex', 'ASC')
                .getMany();

            cachedUserGroups = groups;

            try {
                await RedisClientSingleton.getInstance().set(
                    cacheKey,
                    cachedUserGroups,
                    { ex: REDIS_EXPIRATION_SECONDS }
                );
            } catch (error) {
                console.error('[Redis] Error setting cache:', error);
            }
        }

        res.status(200).json(cachedUserGroups);
    } catch (error) {
        res.status(500).send((error as Error).message);
    }
};
