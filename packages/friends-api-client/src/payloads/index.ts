export type SendFriendRequestPayload = {
    userId: string;
    friendUserId: string;
};

export type AcceptFriendRequestParams = {
    friendId: string;
};

export type RemoveFriendParams = {
    friendId: string;
};

export type GetFriendsParams = {
    userId: string;
};
