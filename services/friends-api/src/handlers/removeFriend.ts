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
        const wasFriendRemoved = await dataSource.manager.transaction(
            // eslint-disable-next-line consistent-return
            async (manager) => {
                const friendEntry = await manager.findOne(FriendEntity, {
                    where: { id: friendId },
                    relations: ['user', 'friend'],
                });

                if (friendEntry) {
                    // the other direction of the friendship
                    await manager.delete(FriendEntity, {
                        user: { id: friendEntry.friend.id },
                        friend: { id: friendEntry.user.id },
                    });

                    await manager.remove(friendEntry);

                    return true;
                }

                return false;
            }
        );

        if (wasFriendRemoved) {
            res.status(204).send();
        } else {
            res.status(404).send();
        }
    } catch (error) {
        console.error('Error in removeFriend:', error);

        // Optionally, notify your error tracking system here.
        res.status(500).send('An unexpected error occurred.');
    }
};
