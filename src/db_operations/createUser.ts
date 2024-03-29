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
}: RegisterUserPayload): Promise<User> {
    const dataSource = await initializeDataSource();

    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);

    const dbUser = new UserDbModel(
        email,
        hashedPassword,
        firstName,
        lastName,
        age
    );
    const savedDbUser = await dataSource.manager.save(dbUser);

    return createAppUser(savedDbUser);
}
