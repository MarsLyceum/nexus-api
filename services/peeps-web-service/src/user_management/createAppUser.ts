import { User as UserDbModel } from '../db_models/User';
import { User } from './User';
import { generateJwt } from './generateJwt';

export async function createAppUser(dbUser: UserDbModel) {
    const appUser: User = {
        id: dbUser.id,
        email: dbUser.email,
        firstName: dbUser.firstName,
        lastName: dbUser.lastName,
        phoneNumber: dbUser.phoneNumber,
    };
    const jwt = await generateJwt(appUser);
    return { ...appUser, token: jwt };
}
