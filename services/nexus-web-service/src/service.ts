#!/usr/bin/env node

import '@google-cloud/trace-agent';

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
import { expressjwt, GetVerificationKey } from 'express-jwt';
import jwksRsa from 'jwks-rsa';
import { WebSocketServer } from 'ws';
import { useServer } from 'graphql-ws/lib/use/ws';
import { PubSub as InMemoryPubSub } from 'graphql-subscriptions';
import { v4 as uuidv4 } from 'uuid';
import { GroupChannelMessage } from 'group-api-client';

import { GooglePubSubClientSingleton } from 'third-party-clients';
import { applyCommonMiddleware } from 'common-middleware';

import { schemaTypeDefs } from './schemaTypeDefs';
import { loadResolvers } from './resolvers/index';
import { fetchAttachmentsForMessage } from './utils';

declare module 'express-serve-static-core' {
    interface Request {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        auth?: any; // Adjust the type as needed (e.g., `User` or a specific interface)
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

    const instanceId = uuidv4();
    const newMessageSubscriptionName = `new-message-${instanceId}`;
    const friendStatusChangedSubscriptionName = `friend-status-changed-${instanceId}`;
    const [newMessageSubscription] =
        await GooglePubSubClientSingleton.getInstance()
            .topic('new-message')
            .createSubscription(newMessageSubscriptionName, {
                ackDeadlineSeconds: 30,
            });
    const [friendStatusChangedSubscription] =
        await GooglePubSubClientSingleton.getInstance()
            .topic('friend-status-changed')
            .createSubscription(friendStatusChangedSubscriptionName, {
                ackDeadlineSeconds: 30,
            });

    newMessageSubscription.on(
        'message',
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        async (message: {
            data: { toString: () => string };
            ack: () => void;
        }) => {
            const eventData = JSON.parse(
                message.data.toString()
            ) as GroupChannelMessage;

            const messageWithAttachments =
                await fetchAttachmentsForMessage(eventData);
            // Publish to local in-memory PubSub so that active websockets get notified
            void localPubSub.publish('MESSAGE_ADDED', {
                messageAdded: messageWithAttachments,
            });

            // Acknowledge the message to prevent redelivery
            message.ack();
        }
    );

    friendStatusChangedSubscription.on(
        'message',
        (message: { data: { toString: () => string }; ack: () => void }) => {
            const eventData = JSON.parse(message.data.toString());

            // Publish to local in-memory PubSub so that active websockets get notified
            void localPubSub.publish('FRIEND_STATUS_CHANGED', {
                friendStatusChanged: eventData,
            });

            // Acknowledge the message to prevent redelivery
            message.ack();
        }
    );

    const serverCleanup = useServer(
        {
            schema,
            // eslint-disable-next-line @typescript-eslint/require-await
            context: async () =>
                // Return the context that you need for subscriptions
                ({ pubsub: localPubSub }),
        },
        wsServer
    );

    // JWT authentication middleware
    const authenticateJWT = expressjwt({
        secret: jwksRsa.expressJwtSecret({
            cache: true,
            rateLimit: true,
            jwksRequestsPerMinute: 5,
            jwksUri:
                'https://dev-upkzwvoukjr1xaus.us.auth0.com/.well-known/jwks.json',
        }) as GetVerificationKey,
        audience: 'JIAbKzkhl7hFKLpYnIJ5gyrKr3ZG3uw8',
        issuer: 'https://dev-upkzwvoukjr1xaus.us.auth0.com/',
        algorithms: ['RS256'],
        credentialsRequired: false,
    });

    app.use(authenticateJWT);

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

    app.post(
        '/graphql',
        conditionalParser,
        cors<cors.CorsRequest>(corsSetting),
        expressMiddleware(apolloServer, {
            // eslint-disable-next-line @typescript-eslint/require-await
            context: async ({ req, res }) => {
                // Extract user from JWT if it exists
                const user = req.auth || null;
                return { pubsub: localPubSub, user, res };
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
