import {
    FriendsApiClient,
    SendFriendRequestPayload,
    AcceptFriendRequestParams,
    SendFriendRequestResponse,
    AcceptFriendRequestResponse,
    GetFriendsParams,
    GetFriendsResponse,
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
    },
    Query: {
        getFriends: async (
            _: never,
            { userId }: GetFriendsParams
        ): Promise<GetFriendsResponse> => {
            const client = new FriendsApiClient();
            const friend = await client.getFriends(userId);
            return friend;
        },
    },
};
