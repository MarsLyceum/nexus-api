import bcrypt from 'bcrypt';
import { User as UserDbModel } from '../db_models/User';
import { initializeDataSource } from './initializeDataSource';
import { User, createAppUser } from '../user_management';

export async function createUser(
    email: string,
    password: string
): Promise<User> {
    const dataSource = await initializeDataSource();

    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);

    const dbUser = new UserDbModel(email, hashedPassword);
    const savedDbUser = await dataSource.manager.save(dbUser);

    return createAppUser(savedDbUser);
}
