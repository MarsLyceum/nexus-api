import { PubSub } from 'graphql-subscriptions';

import { createUser } from '../db_operations/createUser';
import { fetchUser } from '../db_operations/fetchUser';
import { RegisterUserPayload, FetchUserPayload } from '../payloads';

export const resolvers = {
    Mutation: {
        registerUser: async (_: never, payload: RegisterUserPayload) => {
            const user = await createUser(payload);

            return user;
        },
    },
    Query: {
        fetchUser: async (_: never, { email }: FetchUserPayload) =>
            fetchUser(email),
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
