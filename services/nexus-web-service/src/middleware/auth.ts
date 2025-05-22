// src/middleware/auth.ts
import { Request } from 'express';
import jwt from 'jsonwebtoken';
import { ACCESS_JWT_SECRET } from '../config';
import { UnauthenticatedError, getAccessToken } from '../utils';

// URL paths & operation names you want to skip (login/refresh, introspection, etc)
const OPEN_OPERATIONS = new Set([
    'IntrospectionQuery',
    'LoginUser',
    'RegisterUser',
    'RefreshToken',
]);

export type AuthGuardOptions = {
    operationName?: string;
    req: Request;
};

export function authGuard({ operationName, req }: AuthGuardOptions): void {
    if (operationName && OPEN_OPERATIONS.has(operationName)) return;

    const token = getAccessToken(req);
    if (!token) {
        throw new UnauthenticatedError('Not authenticated. No token provided');
    }

    try {
        jwt.verify(token, ACCESS_JWT_SECRET as jwt.Secret);
    } catch (error: unknown) {
        if (error instanceof jwt.TokenExpiredError) {
            throw new UnauthenticatedError(
                `Token expired at ${error.expiredAt.toISOString()}`
            );
        }

        if (error instanceof jwt.JsonWebTokenError) {
            throw new UnauthenticatedError(`Invalid token: ${error.message}`);
        }

        throw new UnauthenticatedError(
            'Authentication failed due to an unexpected error'
        );
    }
}
