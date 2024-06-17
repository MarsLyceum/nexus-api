#!/usr/bin/env node

/**
 * Module dependencies.
 */
import 'reflect-metadata';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { createServer } from 'node:http';
import cors from 'cors';
import express, { Request, Response, NextFunction, json } from 'express';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { PubSub } from 'graphql-subscriptions';

import { schemaTypeDefs } from './schemaTypeDefs';
import { resolvers } from './resolvers/index';

const pubsub = new PubSub();
const app = express();
const httpServer = createServer(app);
const schema = makeExecutableSchema({
    typeDefs: schemaTypeDefs,
    resolvers,
});

const corsSetting = {
    origin: 'http://localhost:8081', // Or '*' for all origins
};

app.use(
    // enable cors for local development
    cors(corsSetting)
);

app.options('*', cors(corsSetting)); // Enable pre-flight request for DELETE request

const port = process.env.PORT || '4000';
app.set('port', port);


/**
 * Create HTTP server.
 */
async function startServer() {
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
    app.get('/graphql/stream', (req, res) => {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        const asyncIterator = pubsub.asyncIterator<{ greetings: string }>('GREETINGS');

        const onData = async () => {
            try {
                // eslint-disable-next-line no-restricted-syntax
                for await (const data of asyncIterator as AsyncIterableIterator<{ greetings: string }>) {
                    res.write(`data: ${JSON.stringify(data)}\n\n`);
                }
            } catch (error) {
                console.error('Failed to stream data:', error);
            }
        };

        onData();

        req.on('close', () => {
            if (asyncIterator.return) {
                asyncIterator.return();
            }
        });
    });

    app.post(
        '/graphql',
        cors<cors.CorsRequest>(corsSetting),
        json(),
        expressMiddleware(apolloServer, {
            context: async ({ req }) => {
                const extendedReq = req as ExtendedRequest;
                return { token: extendedReq.getHeader('token'), pubsub };
            },
        })
    );

    httpServer.listen(port, () => {
        console.log(`Server started on http://localhost:${port}/graphql`);
    });

    async function publishGreetings() {
        await pubsub.publish('GREETINGS', { greetings: 'Hello every 5 seconds' });
    }

    setInterval(() => {
        publishGreetings().catch((error) => {
            console.error('Failed to publish greetings:', error);
        });
    }, 5000);
}

// eslint-disable-next-line no-void
void startServer().catch((error) => {
    console.error('Failed to start server:', error);
});
