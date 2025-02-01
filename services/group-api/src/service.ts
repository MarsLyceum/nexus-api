import express, { Request, Response, NextFunction, Application } from 'express';
import { createServer } from 'node:http';
import { ParsedQs } from 'qs';
import cors from 'cors';

import {
    DeleteGroupParams,
    GetGroupParams,
    UpdateGroupParams,
    UpdateGroupPayload,
    CreateGroupPayload,
    createGroupPayloadSchema,
    getGroupParamsSchema,
    updateGroupParamsSchema,
    updateGroupPayloadSchema,
    deleteGroupParamsSchema,
} from 'group-api-client';

import { createGroup, getGroup, updateGroup, deleteGroup } from './handlers';

import {
    validatePayload,
    validateParams,
} from './middleware/validationMiddleware';

// eslint-disable-next-line @typescript-eslint/require-await
export async function createService(
    port: string | number = process.env.PORT || '4002'
): Promise<{
    app: Application;
    start: () => Promise<void>;
    stop: () => Promise<void>;
}> {
    const app = express();
    const httpServer = createServer(app);

    app.use(express.json()); // Parse JSON bodies
    app.use(cors()); // Enable CORS

    app.set('port', port);

    // Helper to wrap async route handlers
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

    // Define the routes for the group API

    // Create a new group
    app.post(
        '/group',
        validatePayload(createGroupPayloadSchema),
        asyncHandler<unknown, unknown, CreateGroupPayload, ParsedQs>(
            (req, res) => createGroup(req, res)
        )
    );

    // Get a group by id
    app.get(
        '/group/:id',
        validateParams(getGroupParamsSchema),
        asyncHandler<GetGroupParams, unknown, unknown, ParsedQs>((req, res) =>
            getGroup(req, res)
        )
    );

    // Update a group by id
    app.put(
        '/group/:id',
        validateParams(updateGroupParamsSchema),
        validatePayload(updateGroupPayloadSchema),
        asyncHandler<UpdateGroupParams, unknown, UpdateGroupPayload, ParsedQs>(
            (req, res) => updateGroup(req, res)
        )
    );

    // Delete a group by id
    app.delete(
        '/group/:id',
        validateParams(deleteGroupParamsSchema),
        asyncHandler<DeleteGroupParams, unknown, unknown, ParsedQs>(
            (req, res) => deleteGroup(req, res)
        )
    );

    // Health check route
    app.get('/health', (req: Request, res: Response) => {
        res.status(200).send('OK');
    });

    // Error handling middleware
    app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
        console.error(err.stack);
        res.status(500).send('Something broke!');
    });

    async function start() {
        return new Promise<void>((resolve) => {
            httpServer.listen(port, () => {
                console.log(
                    `Group API Server started on http://localhost:${port}`
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
                    console.log(`Group API Server on port ${port} stopped.`);
                    resolve();
                }
            });
        });
    }

    return { app, start, stop };
}
