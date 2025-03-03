import { UserEntity, User, CreateUserPayload } from 'user-api-client';

import { initializeDataSource } from './database/initializeDataSource';

export async function createUser({
    email,
    firstName,
    lastName,
    phoneNumber,
}: CreateUserPayload): Promise<User | undefined> {
    const dataSource = await initializeDataSource();
    let foundUser;
    try {
        foundUser =
            (await dataSource.manager.findOne(UserEntity, {
                where: { email },
            })) ?? undefined;
        return foundUser;
    } catch {
        return dataSource.manager.create(UserEntity, {
            email,
            firstName,
            lastName,
            phoneNumber,
        });
    }
}
