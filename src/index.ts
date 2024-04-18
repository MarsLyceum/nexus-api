#!/usr/bin/env node

/**
 * Module dependencies.
 */

import { IncomingMessage, Server, ServerResponse } from 'node:http';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import cors from 'cors';
import express, { json } from 'express';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';

import { schemas } from './schemas';
import { resolvers } from './resolvers/index';

export const app = express();

app.use(
    // enable cors for local development
    cors({
        origin: 'http://localhost:8081', // Or '*' for all origins
    })
);

const port = process.env.PORT || '4000';
app.set('port', port);

/**
 * Create HTTP server.
 */
async function createServer() {
    const apolloServer = new ApolloServer({
        typeDefs: schemas,
        resolvers,
        plugins: [
            ApolloServerPluginDrainHttpServer({
                httpServer: app as unknown as Server<
                    typeof IncomingMessage,
                    typeof ServerResponse
                >,
            }),
        ],
    });

    await apolloServer.start();

    app.post(
        '/graphql',
        cors<cors.CorsRequest>(),
        json(),
        expressMiddleware(apolloServer, {
            // eslint-disable-next-line @typescript-eslint/require-await
            context: async ({ req }) => ({ token: req.headers.token }),
        })
    );

    app.listen(port, () => {
        console.log(`server started on http://localhost:${port}/graphql`);
    });
}

// eslint-disable-next-line no-void
void createServer();
