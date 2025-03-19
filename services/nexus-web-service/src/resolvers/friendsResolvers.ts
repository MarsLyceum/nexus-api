import { withFilter } from 'graphql-subscriptions';

import {
    FriendsApiClient,
    SendFriendRequestPayload,
    AcceptFriendRequestParams,
    SendFriendRequestResponse,
    AcceptFriendRequestResponse,
    GetFriendsParams,
    GetFriendsResponse,
    RemoveFriendParams,
} from 'friends-api-client';

export const friendsResolvers = {
    Mutation: {
        sendFriendRequest: async (
            _: never,
            payload: SendFriendRequestPayload
        ): Promise<SendFriendRequestResponse> => {
            const client = new FriendsApiClient();
            const friend = await client.sendFriendRequest(payload);
            return friend;
        },
        acceptFriendRequest: async (
            _: never,
            { friendId }: AcceptFriendRequestParams
        ): Promise<AcceptFriendRequestResponse> => {
            const client = new FriendsApiClient();
            const friend = await client.acceptFriendRequest(friendId);
            return friend;
        },

        removeFriend: async (
            _: never,
            { friendId }: RemoveFriendParams
        ): Promise<boolean> => {
            const client = new FriendsApiClient();
            await client.removeFriend(friendId);
            return true;
        },
    },
    Query: {
        getFriends: async (
            _: never,
            { userId }: GetFriendsParams
        ): Promise<GetFriendsResponse> => {
            const client = new FriendsApiClient();
            const friends = await client.getFriends(userId);
            return friends;
        },
    },
    Subscription: {
        friendStatusChanged: {
            subscribe: withFilter(
                // 1. Create an async iterator for all friend status changes
                (_: any, __: any, { pubsub }: any) =>
                    pubsub.asyncIterableIterator('FRIEND_STATUS_CHANGED'),

                // 2. Filter function: Only forward the event if the friend is in the subscriber's friend list.
                async (
                    payload?: {
                        friendStatusChanged: {
                            friendUserId: string;
                            status: string;
                        };
                    },
                    variables?: { userId: any }
                ) => {
                    // Assume variables.userId is passed from the client.
                    // Use a data source (or service) that queries your database using TypeORM.
                    const client = new FriendsApiClient();
                    const friends = await client.getFriends(variables?.userId);

                    // Check if the updated friend exists in the subscriber's friend list.
                    return friends.some(
                        (item: { friend: { id: string } }) =>
                            item.friend.id ===
                            payload?.friendStatusChanged.friendUserId
                    );
                }
            ),
        },
    },
};
