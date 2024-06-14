import { PubSub } from 'graphql-subscriptions';
import { createServer } from 'http';
import express, { json } from 'express';
import cors from 'cors';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { WebSocketServer } from 'ws';
import { useServer } from 'graphql-ws/lib/use/ws';

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

app.use(cors(corsSetting));
app.options('*', cors(corsSetting));

const port = process.env.PORT || '4000';
app.set('port', port);

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

    const wsServer = new WebSocketServer({
        server: httpServer,
        path: '/graphql',
    });

    useServer(
        {
            schema,
            context: () => ({ pubsub }),
        },
        wsServer
    );

    app.post(
        '/graphql',
        cors(corsSetting),
        json(),
        expressMiddleware(apolloServer, {
            context: async ({ req }) => ({ token: req.headers.token, pubsub }),
        })
    );

    httpServer.listen(port, () => {
        console.log(`Server started on http://localhost:${port}/graphql`);
    });

    setInterval(() => {
        console.log('Publishing greetings...');
        pubsub.publish('GREETINGS', { greetings: 'Hello every 5 seconds' });
    }, 5000);
}

startServer().catch((error) => {
    console.error('Failed to start server:', error);
});
