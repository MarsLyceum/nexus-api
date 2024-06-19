import 'reflect-metadata';
import { ApolloServer } from '@apollo/server';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { PubSub } from 'graphql-subscriptions';
import { schemaTypeDefs } from './schemaTypeDefs';
import { resolvers } from './resolvers/index';
import { expressMiddleware } from '@apollo/server/express4';
import express, { Request, Response, json } from 'express';
import cors from 'cors';

const pubsub = new PubSub();
const schema = makeExecutableSchema({
    typeDefs: schemaTypeDefs,
    resolvers,
});

const corsSetting = {
    origin: 'http://localhost:8081', // Or '*' for all origins
};

const app = express();
app.use(cors(corsSetting));
app.use(json());

const startApolloServer = async () => {
    const apolloServer = new ApolloServer({
        schema,
    });

    await apolloServer.start();

    app.post(
        '/graphql',
        expressMiddleware(apolloServer, {
            context: async ({ req }) => ({ pubsub }),
        })
    );

    // SSE endpoint
    app.get('/graphql/stream', (req, res) => {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        const asyncIterator = pubsub.asyncIterator<{ greetings: string }>(
            'GREETINGS'
        );

        const onData = async () => {
            try {
                for await (const data of asyncIterator as AsyncIterableIterator<{
                    greetings: string;
                }>) {
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

    return app;
};

export const graphqlHandler = async (req: Request, res: Response) => {
    const app = await startApolloServer();
    return app(req, res);
};

// Export the function to be used by Google Cloud Functions
export default graphqlHandler;
