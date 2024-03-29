import { createUser } from '../db_operations/createUser';
import { loginUser } from '../db_operations/loginUser';

export const resolvers = {
    Mutation: {
        registerUser: async (
            _: never,
            { email, password }: { email: string; password: string }
        ) => {
            const user = await createUser(email, password);

            return user;
        },
    },
    Query: {
        loginUser(
            _: never,
            { email, password }: { email: string; password: string }
        ) {
            return loginUser(email, password);
        },
    },
};
