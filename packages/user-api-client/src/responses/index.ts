import { User } from '../models';

export type LoginUserResponse = User & {
    token?: string;
    accessToken?: string;
    refreshToken?: string;
    refreshTokenExpiresAt?: string;
};

export type CreateUserResponse = User & {
    token?: string;
    accessToken?: string;
    refreshToken?: string;
    refreshTokenExpiresAt?: string;
};

export type GetUserResponse = User;

export type UpdateUserResponse = User;

export type SearchForUsersResponse = User[];
