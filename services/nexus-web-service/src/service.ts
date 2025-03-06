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
import { PubSub as GCPubSub } from '@google-cloud/pubsub';
import { PubSub as InMemoryPubSub } from 'graphql-subscriptions';
import { v4 as uuidv4 } from 'uuid';
import { GroupChannelMessage } from 'group-api-client';

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
    const pubSubClient = new GCPubSub({
        projectId: 'hephaestus-418809',
    });
    const localPubSub = new InMemoryPubSub();

    const corsSetting = {
        origin: 'http://localhost:8081', // Or '*' for all origins
    };

    app.use(
        // enable cors for local development
        cors(corsSetting)
    );

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    applyCommonMiddleware(app);

    app.options('*', cors(corsSetting)); // Enable pre-flight request for DELETE request

    app.set('port', port);

    const instanceId = uuidv4();
    const subscriptionName = `new-message-${instanceId}`;
    const [subscription] = await pubSubClient
        .topic('new-message')
        .createSubscription(subscriptionName, { ackDeadlineSeconds: 30 });

    subscription.on(
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

    // SSE endpoint
    // app.get('/graphql/stream', (req, res) => {
    //     res.setHeader('Content-Type', 'text/event-stream');
    //     res.setHeader('Cache-Control', 'no-cache');
    //     res.setHeader('Connection', 'keep-alive');

    //     const asyncIterator = pubsub.asyncIterator<{ greetings: string }>(
    //         'GREETINGS'
    //     );

    //     const onData = async () => {
    //         try {
    //             // eslint-disable-next-line no-restricted-syntax
    //             for await (const data of asyncIterator as AsyncIterableIterator<{
    //                 greetings: string;
    //             }>) {
    //                 res.write(`data: ${JSON.stringify(data)}\n\n`);
    //             }
    //         } catch (error) {
    //             console.error('Failed to stream data:', error);
    //         }
    //     };

    //     void onData();

    //     req.on('close', () => {
    //         if (asyncIterator.return) {
    //             void asyncIterator.return();
    //         }
    //     });
    // });

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
            context: async ({ req }) => {
                // Extract user from JWT if it exists
                const user = req.auth || null;
                return { pubsub: localPubSub, user };
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
