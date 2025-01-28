#!/usr/bin/env node

import 'reflect-metadata';
// import { ApolloServer } from '@apollo/server';
// import { expressMiddleware } from '@apollo/server/express4';
// import { makeExecutableSchema } from '@graphql-tools/schema';
// import { createServer } from 'node:http';
// import cors from 'cors';
// import express, { json } from 'express';
// import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
// import { PubSub } from 'graphql-subscriptions';
// import { expressjwt, GetVerificationKey } from 'express-jwt';
// import jwksRsa from 'jwks-rsa';

import { createService as createServicePeepsWebService } from 'peeps-web-service/src/service';
import { createService as createServiceUserApi } from 'user-api/src/service';

async function main() {
    const peepsWebService = createServicePeepsWebService(4000);
    const userApi = createServiceUserApi(4001);

    const services = [
        { name: 'Peeps Web Service', instance: peepsWebService },
        { name: 'User API', instance: userApi },
    ];

    try {
        console.log('Starting all services...');

        for (const service of services) {
            await (await service.instance).start();
            console.log(`${service.name} started successfully.`);
        }

        async function stopAllServices() {
            for (const service of services) {
                try {
                    (await service.instance).stop();
                    console.log(`${service.name} stopped successfully.`);
                } catch (error) {
                    console.error(`Failed to stop ${service.name}:`, error);
                }
            }
        }

        process.on('SIGINT', async () => {
            console.log('\nReceived SIGINT. Shutting down services...');
            await stopAllServices();

            process.exit(0);
        });

        process.on('SIGTERM', async () => {
            console.log('\nReceived SIGTERM. Shutting down services...');
            await stopAllServices();

            process.exit(0);
        });
    } catch (error) {
        console.error('Error while starting services:', error);

        for (const service of services) {
            try {
                (await service.instance).stop();
                console.log(`${service.name} stopped during error handling.`);
            } catch (stopError) {
                console.error(
                    `Failed to stop ${service.name} during error handling:`,
                    stopError
                );
            }
        }

        process.exit(1);
    }
}

main().catch((error) => {
    console.error('Failed to start control service:', error);
    process.exit(1);
});
