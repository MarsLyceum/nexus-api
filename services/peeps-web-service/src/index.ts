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
import express, { json } from 'express';
import { WebSocketServer } from 'ws';
import { useServer } from 'graphql-ws/lib/use/ws';
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

    // WebSocket server for graphql-ws
    const wsServer = new WebSocketServer({
        server: httpServer,
        path: '/graphql',
    });

    useServer({ schema, context: { pubsub } }, wsServer);

    app.post(
        '/graphql',
        cors<cors.CorsRequest>(corsSetting),
        json(),
        expressMiddleware(apolloServer, {
            // eslint-disable-next-line @typescript-eslint/require-await
            context: async ({ req }) => ({ token: req.headers.token, pubsub }),
        })
    );

    httpServer.listen(port, () => {
        console.log(`Server started on http://localhost:${port}/graphql`);
    });

    async function publishGreetings() {
        console.log('Publishing greetings...');
        await pubsub.publish('GREETINGS', { greetings: 'Hello every 5 seconds' });
    }

    setInterval(() => {
        publishGreetings().catch(error => {
            console.error('Failed to publish greetings:', error);
        });
    }, 5000);
}

// eslint-disable-next-line no-void
void startServer().catch((error) => {
    console.error('Failed to start server:', error);
});
