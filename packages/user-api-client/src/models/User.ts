export type User = {
    id: string;
    email: string;
    username: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
    status:
        | 'online'
        | 'offline'
        | 'idle'
        | 'invisible'
        | 'offline_dnd'
        | 'online_dnd';
    token?: string;
    accessToken?: string;
    refreshToken?: string;
};
