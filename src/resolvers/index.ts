import { createUser } from '../db_operations/createUser';
import { loginUser } from '../db_operations/loginUser';
import { RegisterUserPayload, LoginUserPayload } from '../payloads';

export const resolvers = {
    Mutation: {
        registerUser: async (_: never, payload: RegisterUserPayload) => {
            const user = await createUser(payload);

            return user;
        },
    },
    Query: {
        loginUser(_: never, { email, password }: LoginUserPayload) {
            console.log('logging in user...');
            return loginUser(email, password);
        },
    },
};
