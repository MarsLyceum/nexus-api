// handlers.ts

import { Request, Response } from 'express';
import { FriendEntity, SendFriendRequestPayload } from 'friends-api-client';
import { UserApiClient } from 'user-api-client';
import { TypeOrmDataSourceSingleton } from 'third-party-clients';

export const sendFriendRequest = async (
    req: Request<unknown, unknown, SendFriendRequestPayload>,
    res: Response
) => {
    try {
        const { userId, friendUserId } = req.body;
        const dataSource = await TypeOrmDataSourceSingleton.getInstance();

        const userApiClient = new UserApiClient();
        const user = await userApiClient.getUser(userId);
        const friendUser = await userApiClient.getUser(friendUserId);

        // Wrap multiple writes in a transaction.
        const newFriend = await dataSource.manager.transaction(
            async (manager) => {
                const friend = manager.create(FriendEntity, {
                    user,
                    friend: friendUser,
                    requestedBy: user,
                    status: 'pending',
                });
                await manager.save(friend);

                // the other direction of the friendship
                const friendOtherDirection = manager.create(FriendEntity, {
                    user: friendUser,
                    friend: user,
                    requestedBy: user,
                    status: 'pending',
                });
                await manager.save(friendOtherDirection);

                return friend;
            }
        );

        res.status(201).json(newFriend);
    } catch (error) {
        res.status(500).send((error as Error).message);
    }
};
