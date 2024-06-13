import bcrypt from 'bcrypt';
import { User as UserDbModel } from '../db_models/User';
import { initializeDataSource } from './initializeDataSource';
import { User, createAppUser } from '../user_management';
import { RegisterUserPayload } from '../payloads';

export async function createUser({
    email,
    password,
    firstName,
    lastName,
    age,
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
        const salt = await bcrypt.genSalt();
        const hashedPassword = await bcrypt.hash(password, salt);

        const dbUser = new UserDbModel();
        dbUser.email = email;
        dbUser.hashedPassword = hashedPassword;
        dbUser.firstName = firstName ?? '';
        dbUser.lastName = lastName ?? '';
        dbUser.age = age ?? 0;

        const savedDbUser = await dataSource.manager.save(dbUser);

        return createAppUser(savedDbUser);
    }

    return undefined;
}
