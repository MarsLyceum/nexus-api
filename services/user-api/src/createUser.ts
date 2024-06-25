import { UserEntity, User, RegisterUserPayload } from 'user-api-client';

import { initializeDataSource } from './database/initializeDataSource';

export async function createUser({
    email,
    firstName,
    lastName,
    phoneNumber,
}: RegisterUserPayload): Promise<User | undefined> {
    const dataSource = await initializeDataSource();
    let error;
    let foundUser;
    try {
        foundUser =
            (await dataSource.manager.findOne(UserEntity, {
                where: { email },
            })) ?? undefined;
        return foundUser;
    } catch (error_: unknown) {
        error = error_;

        return dataSource.manager.create(UserEntity, {
            email,
            firstName,
            lastName,
            phoneNumber,
        });
    }
}
