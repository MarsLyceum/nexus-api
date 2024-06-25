import 'reflect-metadata';
import { DataSource } from 'typeorm';

import { UserEntity } from 'user-api-client';
import { isRunningInCloudRun } from './isRunningInCloudRun';
import { DATABASE_NAME, DATABASE_USERNAME, DATABASE_PASSWORD } from '../config';

export function createAppDataSource(): DataSource {
    const cloudDb = isRunningInCloudRun();
    const localDbSettings = {
        url: `postgres://${DATABASE_USERNAME}:${DATABASE_PASSWORD}@127.0.0.1:5434/${DATABASE_NAME}`,
    };
    const hostSettings = cloudDb
        ? {
              host: '/cloudsql/hephaestus-418809:us-west1:user-api',
              database: process.env.DATABASE_NAME ?? 'postgres',
              username: process.env.DATABASE_USERNAME ?? 'postgres',
              password: process.env.DATABASE_PASSWORD,
          }
        : localDbSettings;

    return new DataSource({
        type: 'postgres',
        ...hostSettings,
        synchronize: false,
        logging: true,
        entities: [UserEntity],
        migrations: ['migrations/**/*.js'],
        subscribers: [],
    });
}

export const DATA_SOURCE = createAppDataSource();
