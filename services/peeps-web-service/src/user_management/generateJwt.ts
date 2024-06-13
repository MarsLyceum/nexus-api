import jwt from 'jsonwebtoken';
import { promises as fs } from 'node:fs';

import { User } from './User';

// Function to generate JWT
export async function generateJwt(user: Omit<User, 'token'>): Promise<string> {
    const jwtTokenKey =
        process.env.JWT_PRIVATE_KEY ??
        (await fs.readFile('./keys/jwt_private_key.pem'));
    // Sign the token with a 1 day expiration
    const token = jwt.sign(user, jwtTokenKey, {
        expiresIn: '1d', // Token expires in 1 day
        algorithm: 'RS256',
    });

    return token;
}
