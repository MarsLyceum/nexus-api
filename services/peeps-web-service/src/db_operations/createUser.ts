import { User as UserDbModel } from 'user-api-client';
import { User } from '../user_management';
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
            (await dataSource.manager.findOne(UserDbModel, {
                where: { email },
            })) ?? undefined;
    } catch (error_: unknown) {
        error = error_;
    }
    if (!foundUser || error) {
        const dbUser = new UserDbModel();
        dbUser.email = email;
        dbUser.firstName = firstName ?? '';
        dbUser.lastName = lastName ?? '';
        dbUser.phoneNumber = phoneNumber ?? '';

        const savedDbUser = await dataSource.manager.save(dbUser);

        return savedDbUser;
    }

    return foundUser;
}
