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
} from 'user-api-client';

export const userResolvers = {
    Mutation: {
        registerUser: async (
            _: never,
            payload: CreateUserPayload
        ): Promise<CreateUserResponse> => {
            const client = new UserApiClient();
            const user = await client.createUser(payload);
            return user;
        },

        updateUser: async (
            _: never,
            payload: UpdateUserPayload
        ): Promise<CreateUserResponse> => {
            const client = new UserApiClient();
            const user = await client.updateUser(payload.id as string, payload);
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
