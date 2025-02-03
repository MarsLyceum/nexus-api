import express, { Request, Response, NextFunction, Application } from 'express';
import { createServer } from 'node:http';
import { ParsedQs } from 'qs';
import cors from 'cors';
import {
    DeleteUserParams,
    GetUserParams,
    GetUserByEmailParams,
    UpdateUserParams,
    UpdateUserPayload,
    CreateUserPayload,
    createUserPayloadSchema,
    getUserParamsSchema,
    getUserByEmailParamsSchema,
    updateUserParamsSchema,
    updateUserPayloadSchema,
    deleteUserParamsSchema,
} from 'user-api-client';
import {
    createUser,
    getUser,
    updateUser,
    deleteUser,
    getUserByEmail,
} from './handlers';
import {
    validatePayload,
    validateParams,
} from './middleware/validationMiddleware';

// eslint-disable-next-line @typescript-eslint/require-await
export async function createService(
    port: string | number = process.env.PORT || '4001'
): Promise<{
    app: Application;
    start: () => Promise<void>;
    stop: () => Promise<void>;
}> {
    const app = express();
    const httpServer = createServer(app);

    app.use(express.json()); // Middleware to parse JSON bodies

    // Middleware to handle CORS
    app.use(cors());

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
        asyncHandler<unknown, unknown, CreateUserPayload, ParsedQs>(
            (req, res) => createUser(req, res)
        )
    );

    app.get(
        '/user/:userId',
        validateParams(getUserParamsSchema),
        asyncHandler<GetUserParams, unknown, unknown, ParsedQs>((req, res) =>
            getUser(req, res)
        )
    );

    app.get(
        '/user-by-email/:email',
        validateParams(getUserByEmailParamsSchema),
        asyncHandler<GetUserByEmailParams, unknown, unknown, ParsedQs>(
            (req, res) => getUserByEmail(req, res)
        )
    );

    app.put(
        '/user/:userId',
        validateParams(updateUserParamsSchema),
        validatePayload(updateUserPayloadSchema),
        asyncHandler<UpdateUserParams, unknown, UpdateUserPayload, ParsedQs>(
            (req, res) => updateUser(req, res)
        )
    );

    app.delete(
        '/user/:userId',
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

    async function start() {
        return new Promise<void>((resolve) => {
            httpServer.listen(port, () => {
                console.log(
                    `Server started on http://localhost:${port}/graphql`
                );
                resolve();
            });
        });
    }

    async function stop() {
        return new Promise<void>((resolve, reject) => {
            httpServer.close((error) => {
                if (error) {
                    console.error('Failed to stop server:', error);
                    reject(error);
                } else {
                    console.log(`Server on port ${port} stopped.`);
                    resolve();
                }
            });
        });
    }

    return { app, start, stop };
}
