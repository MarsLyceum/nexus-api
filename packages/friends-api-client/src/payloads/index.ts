export type SendFriendRequestPayload = {
    userId: string;
    friendUserId: string;
};

export type AcceptFriendRequestPayload = {
    friendId: string;
};

export type GetFriendsParams = {
    userId: string;
};
