import { Request } from 'express';
import { IncomingMessage } from 'node:http';
import * as cookie from 'cookie';

export function getAccessToken(req: Request | IncomingMessage) {
    const raw = req.headers.cookie ?? '';
    const { access_token: cookieToken } = cookie.parse(raw);

    // 2. try Authorization header
    const authHeader = req.headers.authorization;
    const headerToken =
        authHeader && authHeader.startsWith('Bearer ')
            ? authHeader.slice(7)
            : undefined;

    const token = cookieToken ?? headerToken;

    return token;
}
