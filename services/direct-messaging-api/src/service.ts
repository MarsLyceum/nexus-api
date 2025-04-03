import '@google-cloud/trace-agent';

import express, { Request, Response, NextFunction, Application } from 'express';
import { createServer } from 'node:http';
import { ParsedQs } from 'qs';
import cors from 'cors';

import {
    GetConversationsParams,
    getConversationsParamsSchema,
    GetConversationMessagesParams,
    GetConversationMessagesQueryParams,
    getConversationMessagesParamsSchema,
    CreateConversationPayload,
    createConversationPayloadSchema,
    SendMessageParams,
    sendMessageParamsSchema,
    sendMessagePayloadSchema,
    SendMessagePayload,
    UpdateMessageParams,
    updateMessageParamsSchema,
    updateMessagePayloadSchema,
    UpdateMessagePayload,
    DeleteMessageParams,
    deleteMessageParamsSchema,
} from 'direct-messaging-api-client';
import { TypeOrmDataSourceSingleton } from 'third-party-clients';

import { applyCommonMiddleware } from 'common-middleware';

import {
    getConversations,
    getConversationMessages,
    createConversation,
    sendMessage,
    updateMessage,
    deleteMessage,
} from './handlers';

import {
    validatePayload,
    validateParams,
} from './middleware/validationMiddleware';

// eslint-disable-next-line @typescript-eslint/require-await
export async function createService(
    port: string | number = process.env.PORT || '4004'
): Promise<{
    app: Application;
    start: () => Promise<void>;
    stop: () => Promise<void>;
}> {
    const app = express();
    const httpServer = createServer(app);

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

    app.get(
        '/conversations/:userId',
        validateParams(getConversationsParamsSchema),
        asyncHandler<GetConversationsParams, unknown, unknown, ParsedQs>(
            (req, res) => getConversations(req, res)
        )
    );

    app.get(
        '/conversation/:conversationId',
        validateParams(getConversationMessagesParamsSchema),
        asyncHandler<
            GetConversationMessagesParams,
            unknown,
            unknown,
            GetConversationMessagesQueryParams
        >((req, res) => getConversationMessages(req, res))
    );

    app.post(
        '/conversation',
        validatePayload(createConversationPayloadSchema),
        asyncHandler<unknown, unknown, CreateConversationPayload, ParsedQs>(
            (req, res) => createConversation(req, res)
        )
    );

    app.post(
        '/conversation/:conversationId/message',
        validateParams(sendMessageParamsSchema),
        validatePayload(sendMessagePayloadSchema),
        asyncHandler<SendMessageParams, unknown, SendMessagePayload, ParsedQs>(
            (req, res) => sendMessage(req, res)
        )
    );

    app.put(
        '/conversation/:conversationId/message',
        validateParams(updateMessageParamsSchema),
        validatePayload(updateMessagePayloadSchema),
        asyncHandler<
            UpdateMessageParams,
            unknown,
            UpdateMessagePayload,
            ParsedQs
        >((req, res) => updateMessage(req, res))
    );

    app.delete(
        '/message/:messageId',
        validateParams(deleteMessageParamsSchema),
        asyncHandler<DeleteMessageParams, unknown, unknown, ParsedQs>(
            (req, res) => deleteMessage(req, res)
        )
    );

    // Health check route
    app.get('/health', (req: Request, res: Response) => {
        res.status(200).send('OK');
    });

    // Error handling middleware
    app.use((err: Error, req: Request, res: Response) => {
        console.error(err.stack);
        res.status(500).send('Something broke!');
    });

    async function start(): Promise<void> {
        const dataSource = await TypeOrmDataSourceSingleton.getInstance();

        if (!dataSource.isInitialized) {
            throw new Error('Data source failed to initialize.');
        }

        await new Promise<void>((resolve, reject) => {
            // eslint-disable-next-line consistent-return
            httpServer.listen(port, (err?: Error) => {
                if (err) {
                    return reject(err);
                }
                console.log(
                    `Direct Messaging API Server started on http://localhost:${port}`
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
                    console.log(
                        `Direct Messaging API Server on port ${port} stopped.`
                    );
                    resolve();
                }
            });
        });
    }

    return { app, start, stop };
}
