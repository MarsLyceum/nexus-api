// handlers.ts

import { Request, Response } from 'express';
import { FriendEntity, AcceptFriendRequestPayload } from 'friends-api-client';
import { TypeOrmDataSourceSingleton } from 'third-party-clients';

export const acceptFriendRequest = async (
    req: Request<unknown, unknown, AcceptFriendRequestPayload>,
    res: Response
) => {
    try {
        const { friendId } = req.body;
        const dataSource = await TypeOrmDataSourceSingleton.getInstance();

        // Wrap multiple writes in a transaction.
        const acceptedFriend = await dataSource.manager.transaction(
            // eslint-disable-next-line consistent-return
            async (manager) => {
                const friendEntry = await manager.findOne(FriendEntity, {
                    where: { id: friendId },
                    relations: ['user', 'friend'],
                });

                if (friendEntry) {
                    friendEntry.status = 'accepted';
                    await manager.save(friendEntry);

                    // the other direction of the friendship
                    const friendEntryOtherDirection = await manager.findOne(
                        FriendEntity,
                        {
                            where: { user: { id: friendEntry.friend.id } },
                            relations: ['user', 'friend'],
                        }
                    );
                    if (friendEntryOtherDirection) {
                        friendEntryOtherDirection.status = 'accepted';
                        await manager.save(friendEntryOtherDirection);
                    }

                    return friendEntry;
                }
            }
        );

        res.status(201).json(acceptedFriend);
    } catch (error) {
        res.status(500).send((error as Error).message);
    }
};
