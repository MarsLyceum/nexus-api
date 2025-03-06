// handlers.ts

import { Request, Response } from 'express';
import { GroupEntity, GetUserGroupsParams } from 'group-api-client';
import { initializeDataSource } from '../database';
import { RedisClientSingleton } from '../utils';

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
        let cachedUserGroups =
            await RedisClientSingleton.getInstance().get(cacheKey);

        if (!cachedUserGroups) {
            const dataSource = await initializeDataSource();

            const groups = await dataSource.manager
                .createQueryBuilder(GroupEntity, 'group')
                .leftJoinAndSelect('group.members', 'member')
                .leftJoinAndSelect('group.channels', 'channel')
                .leftJoinAndSelect('channel.messages', 'message')
                .where('member.userId = :userId', { userId })
                .getMany();

            cachedUserGroups = groups;
            await RedisClientSingleton.getInstance().set(
                cacheKey,
                cachedUserGroups
            );
        }

        res.status(200).json(cachedUserGroups);
    } catch (error) {
        res.status(500).send((error as Error).message);
    }
};
