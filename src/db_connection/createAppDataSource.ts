import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { User } from '../db_models/User';
import { decryptDbPassword } from './decryptPassword';
import { isRunningInDocker } from './isRunningInDocker';

export function createAppDataSource(): DataSource {
    const cloudDb = isRunningInDocker();
    const DB_HOST = cloudDb
        ? '/cloudsql/hephaestus-418809:us-west1:hephaestus-postgres'
        : 'localhost';
    const DB_USER = cloudDb ? 'hephaestus-db' : 'postgres';

    return new DataSource({
        type: 'postgres',
        host: DB_HOST,
        port: 5433,
        username: DB_USER,
        password: decryptDbPassword(cloudDb),
        database: 'postgres',
        synchronize: true,
        logging: false,
        entities: [User],
        migrations: [],
        subscribers: [],
    });
}
