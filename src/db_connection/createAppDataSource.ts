import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { User } from '../db_models/User';
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
              password: Buffer.from(
                  'bDBJeXJpQ2BHaEtTeSIvMQ==',
                  'base64'
              ).toString('utf8'),
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
              database: process.env.DATABASE_NAME,
              username: process.env.DATABASE_USER,
              password: process.env.DATABASE_PASSWORD,
          }
        : localDbSettings;
    // : 'localhost';
    // const DB_USER = cloudDb ? 'hephaestus-db' : 'postgres';
    // const DB_USER = cloudDb ? 'hephaestus-db'
    console.log(hostSettings);

    return new DataSource({
        type: 'postgres',
        ...hostSettings,
        username: process.env.DATABASE_USER,
        password: process.env.DATABASE_PASSWORD,
        database: process.env.DATABASE_NAME,
        synchronize: true,
        logging: false,
        entities: [User],
        migrations: [],
        subscribers: [],
    });
}
