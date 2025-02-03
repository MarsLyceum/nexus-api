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
            const user = await client.getUserByEmail(email);
            return user;
        },
    },
    Subscription: {
        greetings: {
            subscribe: (
                _: unknown,
                __: unknown,
                { pubsub }: { pubsub: PubSub }
            ) => pubsub.asyncIterator(['GREETINGS']),
        },
    },
};
