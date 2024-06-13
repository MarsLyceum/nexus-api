import bcrypt from 'bcrypt';
import { initializeDataSource } from './initializeDataSource';
import { User as UserDbModel } from '../db_models/User';
import { User, createAppUser } from '../user_management';

export async function loginUser(
    email: string,
    password: string
): Promise<User | null> {
    const dataSource = await initializeDataSource();

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const foundUser =
        (await dataSource.manager.findOne(UserDbModel, {
            where: { email },
        })) ?? undefined;

    return (await bcrypt.compare(password, foundUser?.hashedPassword ?? '')) &&
        foundUser
        ? createAppUser(foundUser)
        : // we need null for the GraphQL response
          // eslint-disable-next-line unicorn/no-null
          null;
}
