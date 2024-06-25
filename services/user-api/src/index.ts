import express, { Request, Response, NextFunction } from 'express';
import { ParsedQs } from 'qs';
import cors from 'cors';
import { createUser, getUser, updateUser, deleteUser } from './handlers';
import { User, UserIdParam } from './RequestTypes';

const app = express();

app.use(express.json()); // Middleware to parse JSON bodies

// Middleware to handle CORS
app.use(cors());

const port = process.env.PORT || '4000';
app.set('port', port);

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

// Define routes
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

// Health check route
app.get('/health', (req, res) => {
    res.status(200).send('OK');
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
