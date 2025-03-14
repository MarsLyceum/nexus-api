// handlers.ts

import { Request, Response } from 'express';
import { FriendEntity, GetFriendsParams } from 'friends-api-client';
import { TypeOrmDataSourceSingleton } from 'third-party-clients';

export const getFriends = async (
    req: Request<GetFriendsParams>,
    res: Response
) => {
    try {
        const { userId } = req.params;
        if (!userId) {
            res.status(400).send('User ID parameter is missing');
            return;
        }
        const dataSource = await TypeOrmDataSourceSingleton.getInstance();

        // eslint-disable-next-line unicorn/no-array-callback-reference
        const friends = await dataSource.manager.find(FriendEntity, {
            where: { user: { id: userId } },
            relations: ['friend', 'requestedBy'],
        });

        if (!friends) {
            res.status(404).send('Friends not found');
        } else {
            res.status(200).json(friends);
        }
    } catch (error) {
        res.status(500).send((error as Error).message);
    }
};
