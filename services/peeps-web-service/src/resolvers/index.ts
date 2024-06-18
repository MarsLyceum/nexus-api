import { PubSub } from 'graphql-subscriptions';

import { createUser } from '../db_operations/createUser';
import { loginUser } from '../db_operations/loginUser';
import { RegisterUserPayload, FetchUserPayload } from '../payloads';

export const resolvers = {
    Mutation: {
        registerUser: async (_: never, payload: RegisterUserPayload) => {
            const user = await createUser(payload);

            return user;
        },
    },
    Query: {
        fetchUser(_: never, { email }: FetchUserPayload) {
            console.log('logging in user...');
            return loginUser(email, password);
        },
    },
    Subscription: {
        greetings: {
            subscribe: (_: any, __: any, { pubsub }: { pubsub: PubSub }) =>
                pubsub.asyncIterator(['GREETINGS']),
        },
    },
};
