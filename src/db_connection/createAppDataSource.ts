import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { User } from '../db_models/User';
import { decryptDbPassword } from './decryptPassword';
import { isRunningInDocker } from './isRunningInDocker';

export function createAppDataSource(): DataSource {
    // const cloudDb = isRunningInDocker();
    const DB_HOST = '/cloudsql/hephaestus-418809:us-west1:hephaestus-postgres';
    // : 'localhost';
    // const DB_USER = cloudDb ? 'hephaestus-db' : 'postgres';
    // const DB_USER = cloudDb ? 'hephaestus-db'

    return new DataSource({
        type: 'postgres',
        host: DB_HOST,
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
