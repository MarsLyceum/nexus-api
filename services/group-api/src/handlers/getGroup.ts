// handlers.ts

import { Request, Response } from 'express';
import { GroupEntity, GetGroupParams } from 'group-api-client';
import {
    RedisClientSingleton,
    TypeOrmDataSourceSingleton,
} from 'third-party-clients';

/**
 * Handler to retrieve a group by its identifier.
 * Expects a route parameter with the group id.
 */
export const getGroup = async (req: Request<GetGroupParams>, res: Response) => {
    try {
        const { id } = req.params;
        if (!id) {
            res.status(400).send('Group id parameter is missing');
            return;
        }
        const cacheKey = `group:${id}`;
        let cachedGroup =
            await RedisClientSingleton.getInstance().get(cacheKey);

        if (!cachedGroup) {
            const dataSource = await TypeOrmDataSourceSingleton.getInstance();
            const group = await dataSource.manager.findOne(GroupEntity, {
                where: { id },
                relations: ['members', 'channels'],
            });
            cachedGroup = group;
            await RedisClientSingleton.getInstance().set(cacheKey, cachedGroup);
        }

        if (!cachedGroup) {
            res.status(404).send('Group not found');
        } else {
            res.status(200).json(cachedGroup);
        }
    } catch (error) {
        res.status(500).send((error as Error).message);
    }
};
