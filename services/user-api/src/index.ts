import express, { Request, Response, NextFunction } from 'express';
import { ParsedQs } from 'qs';
import { createUser, getUser, updateUser, deleteUser } from './src/handlers';
import { User, UserIdParam } from './src/RequestTypes';

const app = express();
const API_KEY = 'YOUR_API_KEY'; // Replace with your actual API key

app.use(express.json()); // Middleware to parse JSON bodies

// Middleware to check API key
// eslint-disable-next-line consistent-return
app.use((req, res, next) => {
    if (req.headers['x-api-key'] !== API_KEY) {
        return res.status(403).send('Forbidden');
    }
    next();
});

// Helper function to wrap async route handlers
const asyncHandler =
    <
        P = unknown,
        ResBody = unknown,
        ReqBody = unknown,
        ReqQuery = ParsedQs,
        Locals extends Record<string, unknown> = Record<string, unknown>,
    >(
        fn: (
            req: Request<P, ResBody, ReqBody, ReqQuery, Locals>,
            res: Response<ResBody, Locals>,
            next: NextFunction
        ) => Promise<void>
    ) =>
    (
        req: Request<P, ResBody, ReqBody, ReqQuery, Locals>,
        res: Response<ResBody, Locals>,
        next: NextFunction
    ) => {
        fn(req, res, next).catch(next);
    };

app.post(
    '/user',
    asyncHandler<unknown, unknown, User, ParsedQs>((req, res) =>
        createUser(req, res)
    )
);
app.get(
    '/user/:id',
    asyncHandler<UserIdParam, unknown, unknown, ParsedQs>((req, res) =>
        getUser(req, res)
    )
);
app.put(
    '/user/:id',
    asyncHandler<UserIdParam, unknown, User, ParsedQs>((req, res) =>
        updateUser(req, res)
    )
);
app.delete(
    '/user/:id',
    asyncHandler<UserIdParam, unknown, unknown, ParsedQs>((req, res) =>
        deleteUser(req, res)
    )
);

export const api = app;
