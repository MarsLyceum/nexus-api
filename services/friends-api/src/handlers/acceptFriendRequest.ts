// handlers.ts

import { Request, Response } from 'express';
import { FriendEntity, AcceptFriendRequestParams } from 'friends-api-client';
import { TypeOrmDataSourceSingleton } from 'third-party-clients';

export const acceptFriendRequest = async (
    req: Request<AcceptFriendRequestParams, unknown, unknown>,
    res: Response
) => {
    try {
        const { friendId } = req.params;
        console.log('friendId:', friendId);
        const dataSource = await TypeOrmDataSourceSingleton.getInstance();

        // Wrap multiple writes in a transaction.
        const acceptedFriend = await dataSource.manager.transaction(
            // eslint-disable-next-line consistent-return
            async (manager) => {
                const friendEntry = await manager.findOne(FriendEntity, {
                    where: { id: friendId },
                    relations: ['user', 'friend', 'requestedBy'],
                });

                if (
                    friendEntry &&
                    friendEntry.requestedBy.id === friendEntry.friend.id
                ) {
                    friendEntry.status = 'accepted';
                    await manager.save(friendEntry);

                    // the other direction of the friendship
                    const friendEntryOtherDirection = await manager.findOne(
                        FriendEntity,
                        {
                            where: { user: { id: friendEntry.friend.id } },
                            relations: ['user', 'friend', 'requestedBy'],
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
