import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { User } from '../db_models/User';
import { decryptDbPassword } from './decryptPassword';
import { isRunningInDocker } from './isRunningInDocker';

export function createAppDataSource(): DataSource {
    const cloudDb = isRunningInDocker();
    const DB_HOST = '/cloudsql/hephaestus-418809:us-west1:hephaestus-postgres';
    const hostSettings = cloudDb
        ? {
              host: DB_HOST,
              username: process.env.DATABASE_USER,
              password: process.env.DATABASE_PASSWORD,
              database: process.env.DATABASE_NAME,
          }
        : {
              host: 'localhost',
              PORT: 5432,
              username: 'hephaestus-db',
              //   password: Buffer.from(
              //       'bDBJeXJpQ2BHaEtTeSIvMQ==',
              //       'base64'
              //   ).toString('utf8'),
              password: 'l0IyriC`GhKSy"/1',
              database: 'hephaestus-postgres',
          };
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
