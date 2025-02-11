import '@google-cloud/trace-agent';

import express, { Request, Response, NextFunction, Application } from 'express';
import { createServer } from 'node:http';
import { ParsedQs } from 'qs';
import cors from 'cors';
import multer from 'multer';

import {
    DeleteGroupParams,
    GetGroupParams,
    GetUserGroupsParams,
    GetChannelMessagesParams,
    GetChannelMessagesQueryParams,
    UpdateGroupParams,
    UpdateGroupPayload,
    CreateGroupPayload,
    CreateGroupChannelPayload,
    CreateGroupChannelMessagePayload,
    createGroupPayloadSchema,
    createGroupChannelPayloadSchema,
    createGroupChannelMessagePayloadSchema,
    getGroupParamsSchema,
    updateGroupParamsSchema,
    updateGroupPayloadSchema,
    deleteGroupParamsSchema,
    getUserGroupsParamsSchema,
    getChannelMessagesParamsSchema,
    GetPostCommentsParams,
    GetPostCommentsQueryParams,
    getPostCommentsParamsSchema,
    getPostCommentsQueryParamsSchema,
    getChannelMessagesQueryParamsSchema,
    CreateGroupChannelPostCommentPayload,
    createGroupChannelPostCommentPayloadSchema,
} from 'group-api-client';

import { applyCommonMiddleware } from 'common-middleware';

import {
    createGroup,
    createGroupChannel,
    createGroupChannelMessage,
    getChannelMessages,
    getGroup,
    updateGroup,
    deleteGroup,
    getUserGroups,
    createGroupChannelPostComment,
    getGroupChannelPostComments,
} from './handlers';

import { initializeDataSource } from './database';

import {
    validatePayload,
    validateParams,
    validateQueryParams,
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
    const upload = multer({ storage: multer.memoryStorage() });

    app.use(express.json()); // Parse JSON bodies
    app.use(cors()); // Enable CORS

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    applyCommonMiddleware(app);

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
        upload.single('avatar'),
        validatePayload(createGroupPayloadSchema),
        asyncHandler<unknown, unknown, CreateGroupPayload, ParsedQs>(
            (req, res) => createGroup(req, res)
        )
    );

    app.post(
        '/channel',
        validatePayload(createGroupChannelPayloadSchema),
        asyncHandler<unknown, unknown, CreateGroupChannelPayload, ParsedQs>(
            (req, res) => createGroupChannel(req, res)
        )
    );

    // Create a new group channel message
    app.post(
        '/group-channel-message',
        validatePayload(createGroupChannelMessagePayloadSchema),
        asyncHandler<
            unknown,
            unknown,
            CreateGroupChannelMessagePayload,
            ParsedQs
        >((req, res) => createGroupChannelMessage(req, res))
    );

    app.post(
        '/comment',
        validatePayload(createGroupChannelPostCommentPayloadSchema),
        asyncHandler<
            unknown,
            unknown,
            CreateGroupChannelPostCommentPayload,
            ParsedQs
        >((req, res) => createGroupChannelPostComment(req, res))
    );

    // Get a group by id
    app.get(
        '/group/:id',
        validateParams(getGroupParamsSchema),
        asyncHandler<GetGroupParams, unknown, unknown, ParsedQs>((req, res) =>
            getGroup(req, res)
        )
    );

    app.get(
        '/user-groups/:userId',
        validateParams(getUserGroupsParamsSchema),
        asyncHandler<GetUserGroupsParams, unknown, unknown, ParsedQs>(
            (req, res) => getUserGroups(req, res)
        )
    );

    // GET /channels/:channelId/messages?offset=0
    app.get(
        '/channels/:channelId/messages',
        validateParams(getChannelMessagesParamsSchema),
        validateQueryParams(getChannelMessagesQueryParamsSchema),
        asyncHandler<
            GetChannelMessagesParams,
            unknown,
            unknown,
            GetChannelMessagesQueryParams
        >((req, res) => getChannelMessages(req, res))
    );

    // GET /post/:postId/comments?offset=0&limit=10
    app.get(
        '/post/:postId/comments',
        validateParams(getPostCommentsParamsSchema),
        validateQueryParams(getPostCommentsQueryParamsSchema),
        asyncHandler<
            GetPostCommentsParams,
            unknown,
            unknown,
            GetPostCommentsQueryParams
        >((req, res) => getGroupChannelPostComments(req, res))
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

    async function start(): Promise<void> {
        const dataSource = await initializeDataSource();

        if (!dataSource.isInitialized) {
            throw new Error('Data source failed to initialize.');
        }

        await new Promise<void>((resolve, reject) => {
            httpServer.listen(port, (err?: Error) => {
                if (err) {
                    return reject(err);
                }
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
