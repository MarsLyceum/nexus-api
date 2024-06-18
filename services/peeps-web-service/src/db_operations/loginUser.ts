import { initializeDataSource } from './initializeDataSource';
import { User as UserDbModel } from '../db_models/User';
import { User } from '../user_management';

export async function fetchUser(
    email: string,
): Promise<User | null> {
    const dataSource = await initializeDataSource();

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const foundUser =
        (await dataSource.manager.findOne(UserDbModel, {
            where: { email },
        })) ?? undefined;

    // eslint-disable-next-line unicorn/no-null
    return foundUser ?? null;
}
