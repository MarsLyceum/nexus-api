export type CreateUserPayload = {
    email: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
};

export type GetUserParams = {
    userId: string;
};

export type GetUserByEmailParams = {
    email: string;
};

export type UpdateUserParams = GetUserParams;

export type UpdateUserPayload = CreateUserPayload;

export type DeleteUserParams = GetUserParams;
