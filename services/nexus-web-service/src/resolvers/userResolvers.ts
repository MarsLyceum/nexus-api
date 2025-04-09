import { AuthenticationClient } from 'auth0';
import jwt from 'jsonwebtoken';

import {
    UserApiClient,
    CreateUserPayload,
    UpdateUserPayload,
    CreateUserResponse,
    GetUserResponse,
    GetUserParams,
    GetUserByEmailParams,
    SearchForUsersParams,
    SearchForUsersResponse,
    LoginUserPayload,
    LoginUserResponse,
} from 'user-api-client';

import {
    AUTH0_DOMAIN,
    AUTH0_CLIENT_ID,
    AUTH0_AUDIENCE,
    AUTH0_CLIENT_SECRET,
    JWT_SECRET,
} from '../config';

const auth0 = new AuthenticationClient({
    domain: AUTH0_DOMAIN ?? '',
    clientId: AUTH0_CLIENT_ID ?? '',
    clientSecret: AUTH0_CLIENT_SECRET ?? '',
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function loginUser({ email, password }: LoginUserPayload, ctx: any) {
    // Call the password grant endpoint via the new Node client
    const credentials = await auth0.oauth.passwordGrant({
        username: email,
        password,
        realm: 'Username-Password-Authentication',
        audience: AUTH0_AUDIENCE,
        scope: 'openid profile email',
    });

    // Extract and decode the id_token
    const idToken = credentials.data.id_token;
    // const decodedToken = jwtDecode<DecodedToken>(idToken);

    const client = new UserApiClient();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
    const user = await client.getUserByEmail(email);

    const token = jwt.sign(
        {
            id: user.id,
            email: user.email,
        },
        JWT_SECRET as string,
        { expiresIn: '1h' }
    );

    // Set the token as a secure, HttpOnly cookie
    ctx.res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 1000 * 60 * 60, // 1 hour expiration
    });

    return { ...user, token: idToken };
}

export const userResolvers = {
    Mutation: {
        loginUser: async (
            _: never,
            payload: LoginUserPayload,
            ctx: unknown
        ): Promise<LoginUserResponse> => loginUser(payload, ctx),

        registerUser: async (
            _: never,
            payload: CreateUserPayload,
            ctx: unknown
        ): Promise<CreateUserResponse> => {
            await auth0.database.signUp({
                email: payload.email,
                password: payload.password,
                connection: 'Username-Password-Authentication',
            });

            const client = new UserApiClient();
            await client.createUser(payload);

            return loginUser(
                {
                    email: payload.email,
                    password: payload.password,
                },
                ctx
            );
        },

        updateUser: async (
            _: never,
            payload: UpdateUserPayload
        ): Promise<CreateUserResponse> => {
            const client = new UserApiClient();
            const user = await client.updateUser(payload.id, payload);
            return user;
        },
    },
    Query: {
        fetchUser: async (
            _: never,
            { userId }: GetUserParams
        ): Promise<GetUserResponse> => {
            const client = new UserApiClient();
            const user = await client.getUser(userId);
            return user;
        },

        fetchUserByEmail: async (
            _: never,
            { email }: GetUserByEmailParams
        ): Promise<GetUserResponse> => {
            const client = new UserApiClient();
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
            const user = await client.getUserByEmail(email);
            // eslint-disable-next-line @typescript-eslint/no-unsafe-return
            return user;
        },

        searchForUsers: async (
            _: never,
            { searchQuery }: SearchForUsersParams
        ): Promise<SearchForUsersResponse> => {
            const client = new UserApiClient();
            const users = await client.searchForUsers(searchQuery);
            return users;
        },
    },
};
