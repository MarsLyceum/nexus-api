#!/usr/bin/env node

import '@google-cloud/trace-agent';

import jwt from 'jsonwebtoken';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { config } from 'dotenv';
import 'reflect-metadata';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { createServer } from 'node:http';
import cors from 'cors';
import express, { Application, Request, Response, NextFunction } from 'express';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { WebSocketServer } from 'ws';
import { useServer } from 'graphql-ws/lib/use/ws';
import { PubSub as InMemoryPubSub } from 'graphql-subscriptions';
import { v4 as uuidv4 } from 'uuid';
import { GroupChannelMessage } from 'group-api-client';
import { Message } from 'direct-messaging-api-client';

import { GooglePubSubClientSingleton } from 'third-party-clients';
import { applyCommonMiddleware } from 'common-middleware';

import { schemaTypeDefs } from './schemaTypeDefs';
import { loadResolvers } from './resolvers/index';
import {
    fetchAttachmentsForMessage,
    fetchAttachmentsForDm,
    getAccessToken,
} from './utils';
import { ACCESS_JWT_SECRET } from './config';
import { authGuard } from './middleware';

declare module 'express' {
    interface Request {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        auth?: unknown;
    }
}

export async function createService(
    port: string | number = process.env.PORT || '4000'
): Promise<{
    app: Application;
    start: () => Promise<void>;
    stop: () => Promise<void>;
}> {
    const app = express();
    const httpServer = createServer(app);
    const wsServer = new WebSocketServer({
        server: httpServer,
        path: '/graphql', // This path will handle WebSocket connections
    });
    const resolvers = await loadResolvers();
    const schema = makeExecutableSchema({
        typeDefs: schemaTypeDefs,
        resolvers,
    });
    const localPubSub = new InMemoryPubSub();

    const allowedOrigins = new Set([
        // next local
        'http://localhost:3000',
        // react native local
        'http://localhost:8081',
        // dev
        'https://dev.my-nexus.net',
    ]);

    const corsSetting = {
        origin(
            origin: string | undefined,
            callback: (err: Error | null, allow?: boolean) => void
        ) {
            // Allow requests with no origin (like mobile apps or curl requests)
            if (!origin) return callback(null, true);
            return allowedOrigins.has(origin)
                ? callback(null, true)
                : callback(new Error('Not allowed by CORS'), false);
        },
        credentials: true,
    };

    app.use(cors(corsSetting));

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    applyCommonMiddleware(app);

    app.options('*', cors(corsSetting)); // Enable pre-flight request for DELETE request

    app.set('port', port);

    const activeSubscriptions = new Set<string>();
    const instanceId = uuidv4();

    async function ensureUserSubscription(userId: string) {
        const topicName = `u-${userId}`;
        const subscriptionName = `${topicName}-${instanceId}`;
        const pubsub = GooglePubSubClientSingleton.getInstance();

        const topic = pubsub.topic(topicName);
        const [topicExists] = await topic.exists();
        if (!topicExists) {
            // swallow ALREADY_EXISTS races
            try {
                await pubsub.createTopic(topicName);
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (error: any) {
                if (error.code !== 6) {
                    // 6 = ALREADY_EXISTS
                    throw error;
                }
            }
        }

        if (activeSubscriptions.has(subscriptionName)) return;
        activeSubscriptions.add(subscriptionName);

        const [pubsubSub] = await topic.createSubscription(subscriptionName, {
            ackDeadlineSeconds: 30,
        });

        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        pubsubSub.on('message', async (message) => {
            const envelope = JSON.parse(message.data.toString()) as {
                type: 'new-dm' | 'new-message' | 'friend-status-changed';
                payload: GroupChannelMessage | Message | unknown;
            };

            switch (envelope.type) {
                case 'new-message': {
                    const messageWithAttachments =
                        await fetchAttachmentsForMessage(
                            envelope.payload as GroupChannelMessage
                        );
                    // Publish to local in-memory PubSub so that active websockets get notified
                    void localPubSub.publish('MESSAGE_ADDED', {
                        messageAdded: messageWithAttachments,
                    });
                    break;
                }

                case 'new-dm': {
                    const messageWithAttachments = await fetchAttachmentsForDm(
                        envelope.payload as Message
                    );

                    void localPubSub.publish('DM_ADDED', {
                        dmAdded: messageWithAttachments,
                    });
                    break;
                }

                case 'friend-status-changed': {
                    void localPubSub.publish('FRIEND_STATUS_CHANGED', {
                        friendStatusChanged: envelope.payload,
                    });
                    break;
                }

                default: {
                    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
                    console.warn(`Unknown event type: ${envelope.type}`);
                }
            }

            message.ack();
        });
    }

    const serverCleanup = useServer(
        {
            schema,
            context: async (ctx) => {
                // parse cookie + verify JWT
                const token = getAccessToken(ctx.extra.request);
                const payload = jwt.verify(
                    token ?? '',
                    ACCESS_JWT_SECRET as jwt.Secret
                ) as jwt.JwtPayload;

                // ensure Pub/Sub subscription here too
                await ensureUserSubscription(payload.id);

                return { pubsub: localPubSub, user: payload };
            },
        },
        wsServer
    );

    const apolloServer = new ApolloServer({
        schema,
        plugins: [
            ApolloServerPluginDrainHttpServer({
                httpServer,
            }),
        ],
    });

    await apolloServer.start();

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const { default: graphqlUploadExpress } = await import(
        'graphql-upload/graphqlUploadExpress.mjs'
    );

    // eslint-disable-next-line consistent-return
    function conditionalParser(
        req: Request,
        res: Response,
        next: NextFunction
    ) {
        if (req.is('multipart/form-data')) {
            graphqlUploadExpress({ maxFileSize: 100_000_000, maxFiles: 10 })(
                req,
                res,
                next
            );
        } else {
            express.json()(req, res, next);
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    app.use(async (req, _res, next) => {
        // @ts-expect-error auth
        const user = req.auth as jwt.JwtPayload | undefined;
        if (user?.id) {
            try {
                await ensureUserSubscription(user.id);
            } catch (error) {
                console.error(
                    'Failed to ensure subscription for user',
                    user.id,
                    error
                );
            }
        }
        next();
    });

    app.post(
        '/graphql',
        conditionalParser,
        cors<cors.CorsRequest>(corsSetting),
        expressMiddleware(apolloServer, {
            // eslint-disable-next-line @typescript-eslint/require-await
            context: async ({ req, res }) => {
                const { operationName } = req.body as {
                    operationName?: string;
                    variables?: { accessToken?: string };
                };

                authGuard({ operationName, req });

                // Extract user from JWT if it exists
                const user = req.auth || null;
                return { pubsub: localPubSub, user, res, req };
            },
        })
    );

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
        await serverCleanup.dispose();
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
