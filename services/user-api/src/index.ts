import express, { Request, Response, NextFunction } from 'express';
import { ParsedQs } from 'qs';
import cors from 'cors';
import {
    DeleteUserParams,
    GetUserParams,
    UpdateUserParams,
    UpdateUserPayload,
    CreateUserPayload,
    createUserPayloadSchema,
    getUserParamsSchema,
    updateUserParamsSchema,
    updateUserPayloadSchema,
    deleteUserParamsSchema,
} from 'user-api-client';
import { createUser, getUser, updateUser, deleteUser } from './handlers';
import {
    validatePayload,
    validateParams,
} from './middleware/validationMiddleware';

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
    validatePayload(createUserPayloadSchema),
    asyncHandler<unknown, unknown, CreateUserPayload, ParsedQs>((req, res) =>
        createUser(req, res)
    )
);

app.get(
    '/user/:email',
    validateParams(getUserParamsSchema),
    asyncHandler<GetUserParams, unknown, unknown, ParsedQs>((req, res) =>
        getUser(req, res)
    )
);

app.put(
    '/user/:email',
    validateParams(updateUserParamsSchema),
    validatePayload(updateUserPayloadSchema),
    asyncHandler<UpdateUserParams, unknown, UpdateUserPayload, ParsedQs>(
        (req, res) => updateUser(req, res)
    )
);

app.delete(
    '/user/:email',
    validateParams(deleteUserParamsSchema),
    asyncHandler<DeleteUserParams, unknown, unknown, ParsedQs>((req, res) =>
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
