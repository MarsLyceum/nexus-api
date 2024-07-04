import { PubSub } from 'graphql-subscriptions';

import {
    UserApiClient,
    CreateUserPayload,
    CreateUserResponse,
    GetUserParams,
} from 'user-api-client';
// import { createUser } from '../db_operations/createUser';
// import { fetchUser } from '../db_operations/fetchUser';
// import { CreateUserPayload, FetchUserPayload } from '../payloads';

export const resolvers = {
    Mutation: {
        registerUser: async (
            _: never,
            payload: CreateUserPayload
        ): Promise<CreateUserResponse> => {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
            const client = new UserApiClient();

            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
            const user = await client.createUser(payload);

            // eslint-disable-next-line @typescript-eslint/no-unsafe-return
            return user;
        },
    },
    Query: {
        fetchUser: async (_: never, { email }: GetUserParams) => {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
            const client = new UserApiClient();

            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
            const user = await client.getUser(email);

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
            ) => pubsub.asyncIterator(['GREETINGS']),
        },
    },
};
