import { PubSub } from 'graphql-subscriptions';
import {
    UserApiClient,
    CreateUserPayload,
    CreateUserResponse,
    GetUserResponse,
    GetUserParams,
    GetUserByEmailParams,
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
    },
    Subscription: {
        greetings: {
            subscribe: (
                _: unknown,
                __: unknown,
                { pubsub }: { pubsub: PubSub }
            ) => pubsub.asyncIterableIterator(['GREETINGS']),
        },
    },
};
