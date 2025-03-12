// handlers.ts

import { Request, Response } from 'express';
import { FriendEntity, RemoveFriendParams } from 'friends-api-client';
import { TypeOrmDataSourceSingleton } from 'third-party-clients';

export const removeFriend = async (
    req: Request<RemoveFriendParams, unknown, unknown>,
    res: Response
) => {
    try {
        const { friendId } = req.params;
        const dataSource = await TypeOrmDataSourceSingleton.getInstance();

        // Wrap multiple writes in a transaction.
        await dataSource.manager.transaction(
            // eslint-disable-next-line consistent-return
            async (manager) => {
                const friendEntry = await manager.findOne(FriendEntity, {
                    where: { id: friendId },
                    relations: ['user', 'friend'],
                });

                if (friendEntry) {
                    // the other direction of the friendship
                    await manager.delete(FriendEntity, {
                        where: { user: { id: friendEntry.friend.id } },
                        relations: ['user', 'friend'],
                    });

                    await manager.remove(friendEntry);
                }
            }
        );

        res.status(204).send();
    } catch (error) {
        res.status(500).send((error as Error).message);
    }
};
