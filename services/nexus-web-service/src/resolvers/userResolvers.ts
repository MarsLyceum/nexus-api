import { AuthenticationClient } from 'auth0';
import jwt from 'jsonwebtoken';
import * as cookie from 'cookie';

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
    ACCESS_JWT_SECRET,
    REFRESH_TOKEN_SECRET,
} from '../config';
import { UnauthenticatedError } from '../utils';

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

    const accessJwt = jwt.sign(
        {
            id: user.id,
            email: user.email,
        },
        ACCESS_JWT_SECRET as string,
        { expiresIn: '15m' }
    );

    const refreshJwt = jwt.sign(
        { id: user.id, email: user.email },
        REFRESH_TOKEN_SECRET as string,
        { expiresIn: '7d' }
    );

    const isProd = process.env.NODE_ENV === 'production';

    ctx.res.cookie('access_token', accessJwt, {
        httpOnly: true,
        secure: isProd,
        sameSite: 'strict',
        maxAge: 1000 * 60 * 15, // 15 minutes
    });

    const refreshTokenExpiresIn = 7 * 24 * 60 * 60 * 1000; // 1 week
    ctx.res.cookie('refresh_token', refreshJwt, {
        httpOnly: true,
        secure: isProd,
        sameSite: 'strict',
        maxAge: refreshTokenExpiresIn, // 1 week
    });

    return {
        ...user,
        token: idToken,
        accessToken: accessJwt,
        refreshToken: refreshJwt,
        refreshTokenExpiresAt: `${Date.now() + refreshTokenExpiresIn * 1000}`,
    };
}

export const userResolvers = {
    Mutation: {
        loginUser: async (
            _: never,
            payload: LoginUserPayload,
            ctx: unknown
        ): Promise<LoginUserResponse> => loginUser(payload, ctx),

        refreshToken: (
            _: never,
            { refreshToken }: { refreshToken?: string },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ctx: any
        ): {
            accessToken: string;
            refreshToken: string;
            refreshTokenExpiresAt: string;
        } => {
            const raw = ctx.req.headers.cookie ?? '';
            // eslint-disable-next-line @typescript-eslint/naming-convention
            const { refresh_token } = cookie.parse(raw);

            if (!refresh_token && !refreshToken) {
                throw new UnauthenticatedError('No refresh token available');
            }
            const refreshTokenJwt = (refresh_token ?? refreshToken) as string;

            let payload: jwt.JwtPayload;
            try {
                payload = jwt.verify(
                    refreshTokenJwt,
                    REFRESH_TOKEN_SECRET as string
                ) as jwt.JwtPayload;
            } catch {
                throw new UnauthenticatedError('Invalid refresh token');
            }

            // 2. issue a fresh short‐lived access token
            const newAccessToken = jwt.sign(
                { id: payload.id, email: payload.email },
                ACCESS_JWT_SECRET as string,
                { expiresIn: '15m' }
            );

            const newRefreshJwt = jwt.sign(
                { id: payload.id, email: payload.email },
                REFRESH_TOKEN_SECRET as string,
                { expiresIn: '7d' }
            );

            // 3. set it as an HttpOnly cookie
            const isProd = process.env.NODE_ENV === 'production';
            ctx.res.cookie('access_token', newAccessToken, {
                httpOnly: true,
                secure: isProd,
                sameSite: 'strict',
                maxAge: 1000 * 60 * 15, // 15 minutes
            });

            const refreshTokenExpiresIn = 7 * 24 * 60 * 60 * 1000; // 1 week

            ctx.res.cookie('refresh_token', newRefreshJwt, {
                httpOnly: true,
                secure: isProd,
                sameSite: 'strict',
                maxAge: refreshTokenExpiresIn, // 1 week
            });

            return {
                accessToken: newAccessToken,
                refreshToken: newRefreshJwt,
                refreshTokenExpiresAt: `${Math.floor(Date.now() / 1000) + refreshTokenExpiresIn}`,
            };
        },
        registerUser: async (
            _: never,
            { password, ...payload }: CreateUserPayload & { password: string },
            ctx: unknown
        ): Promise<CreateUserResponse> => {
            await auth0.database.signUp({
                email: payload.email,
                password,
                connection: 'Username-Password-Authentication',
            });

            const client = new UserApiClient();
            await client.createUser(payload);

            return loginUser(
                {
                    email: payload.email,
                    password,
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
