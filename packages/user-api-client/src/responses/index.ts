type DbUser = {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
};

export type CreateUserResponse = DbUser;

export type GetUserResponse = DbUser;

export type UpdateUserResponse = DbUser;
