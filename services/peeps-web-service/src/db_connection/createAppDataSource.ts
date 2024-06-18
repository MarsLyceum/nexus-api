import 'reflect-metadata';
import { DataSource } from 'typeorm';

import { User } from '../db_models/User';
import { isRunningInCloudRun } from './isRunningInCloudRun';
import { DATABASE_NAME, DATABASE_USERNAME, DATABASE_PASSWORD } from '../config';

export function createAppDataSource(): DataSource {
    const cloudDb = isRunningInCloudRun();
    const sqlProxy = true;
    const localDbSettings = sqlProxy
        ? {
              url: `postgres://${DATABASE_USERNAME}:${DATABASE_PASSWORD}@127.0.0.1:5434/${DATABASE_NAME}`,
          }
        : {
              host: 'localhost',
              PORT: 5432,
              database: 'postgres',
              username: 'postgres',
              //   password: decryptDbPassword(cloudDb),
          };
    const hostSettings = cloudDb
        ? {
              host: '/cloudsql/hephaestus-418809:us-west1:hephaestus-postgres',
              database: process.env.DATABASE_NAME ?? 'hephaestus-postgres',
              username: process.env.DATABASE_USER ?? 'hephaestus-db',
              password: process.env.DATABASE_PASSWORD,
          }
        : localDbSettings;
    // : 'localhost';
    // const DB_USER = cloudDb ? 'hephaestus-db' : 'postgres';
    // const DB_USER = cloudDb ? 'hephaestus-db'

    return new DataSource({
        type: 'postgres',
        ...hostSettings,
        synchronize: false,
        logging: true,
        entities: [User],
        migrations: [],
        subscribers: [],
    });
}

export const DATA_SOURCE = createAppDataSource()