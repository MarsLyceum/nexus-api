import { User } from '../models';

export type LoginUserPayload = {
    email: string;
    password: string;
};

export type CreateUserPayload = User;

export type GetUserParams = {
    userId: string;
};

export type GetUserByEmailParams = {
    email: string;
};

export type SearchForUsersParams = {
    searchQuery: string;
};

export type UpdateUserParams = GetUserParams;

type MakeOptionalExcept<T, K extends keyof T> = Pick<T, K> &
    Partial<Omit<T, K>>;

export type UpdateUserPayload = MakeOptionalExcept<User, 'id'>;

export type DeleteUserParams = GetUserParams;
