import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { User } from '../db_models/User';
import { encode } from 'html-entities';

import { decryptDbPassword } from './decryptPassword';
import { isRunningInDocker } from './isRunningInDocker';

export function createAppDataSource(): DataSource {
    const cloudDb = isRunningInDocker();
    const sqlProxy = false;
    const localDbSettings = sqlProxy
        ? {
              host: 'localhost',
              PORT: 5432,
              database: 'hephaestus-postgres',
              username: 'hephaestus-db',
              password: encode(
                  Buffer.from('bDBJeXJpQ2BHaEtTeSIvMQ==', 'base64').toString(
                      'utf8'
                  ),
                  { mode: 'nonAsciiPrintable' }
              ),
          }
        : {
              host: 'localhost',
              PORT: 5432,
              database: 'postgres',
              username: 'postgres',
              password: decryptDbPassword(),
          };
    const hostSettings = cloudDb
        ? {
              host: '/cloudsql/hephaestus-418809:us-west1:hephaestus-postgres',
              database: process.env.DATABASE_NAME ?? 'hephaestus-postgres',
              username: process.env.DATABASE_USER ?? 'hephaestus-db',
              password:
                  process.env.DATABASE_PASSWORD ??
                  Buffer.from('bDBJeXJpQ2BHaEtTeSIvMQ==', 'base64').toString(
                      'utf8'
                  ),
          }
        : localDbSettings;
    // : 'localhost';
    // const DB_USER = cloudDb ? 'hephaestus-db' : 'postgres';
    // const DB_USER = cloudDb ? 'hephaestus-db'
    console.log(hostSettings);

    return new DataSource({
        type: 'postgres',
        ...hostSettings,
        synchronize: true,
        logging: false,
        entities: [User],
        migrations: [],
        subscribers: [],
    });
}
