#!/usr/bin/env node

import 'reflect-metadata';

// @ts-expect-error workspace
import { createService as createServicePeepsWebService } from 'nexus-web-service/src/service';
// @ts-expect-error workspace
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
            // eslint-disable-next-line no-await-in-loop, unicorn/no-await-expression-member
            await (await service.instance).start();
            console.log(`${service.name} started successfully.`);
        }

        // eslint-disable-next-line no-inner-declarations
        async function stopAllServices() {
            for (const service of services) {
                try {
                    // eslint-disable-next-line no-await-in-loop, unicorn/no-await-expression-member
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
                // eslint-disable-next-line no-await-in-loop, unicorn/no-await-expression-member
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
