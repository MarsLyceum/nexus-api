import { Request, Response } from 'express';
import {
    UserEntity,
    UpdateUserParams,
    UpdateUserPayload,
} from 'user-api-client';
import {
    TypeOrmDataSourceSingleton,
    GooglePubSubClientSingleton,
} from 'third-party-clients';
import { FriendsApiClient } from 'friends-api-client';

export const updateUser = async (
    req: Request<UpdateUserParams, unknown, UpdateUserPayload>,
    res: Response
    // eslint-disable-next-line @typescript-eslint/require-await
) => {
    try {
        const { userId } = req.params;
        const { firstName, lastName, phoneNumber, email, status } = req.body;

        const pubsub = GooglePubSubClientSingleton.getInstance();

        if (status) {
            const friendsApiClient = new FriendsApiClient();

            const friends = await friendsApiClient.getFriends(userId);

            const dataBuffer = Buffer.from(
                JSON.stringify({
                    type: 'friend-status-changed',
                    payload: {
                        friendUserId: userId,
                        status,
                    },
                })
            );

            for (const friend of friends) {
                const topicName = `u-${friend.user.id}`;
                const topic = pubsub.topic(topicName);

                await topic.publishMessage({ data: dataBuffer });
            }
        }

        const dataSource = await TypeOrmDataSourceSingleton.getInstance();
        const user = await dataSource.manager.findOne(UserEntity, {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            where: { id: userId },
        });

        if (!user) {
            res.status(404).send('User not found');
            return;
        }

        user.firstName = firstName ?? user.firstName;
        user.lastName = lastName ?? user.lastName;
        user.phoneNumber = phoneNumber ?? user.phoneNumber;
        user.email = email ?? user.email;
        user.status = status ?? user.status;

        await dataSource.manager.save(user);

        res.status(204).json(user);
    } catch (error) {
        res.status(500).send((error as Error).message);
    }
};
