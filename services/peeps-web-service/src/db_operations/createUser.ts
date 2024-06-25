import { UserEntity, User } from 'user-api-client';
import { RegisterUserPayload } from '../payloads';

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
    } catch (error_: unknown) {
        error = error_;
    }
    if (!foundUser || error) {
        const dbUser = new UserEntity();
        dbUser.email = email;
        dbUser.firstName = firstName ?? '';
        dbUser.lastName = lastName ?? '';
        dbUser.phoneNumber = phoneNumber ?? '';

        const savedDbUser = await dataSource.manager.save(dbUser);

        return savedDbUser;
    }

    return foundUser;
}
