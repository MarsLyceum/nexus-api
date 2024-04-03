import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { User } from '../db_models/User';
import { decryptDbPassword } from './decryptPassword';
// import { isRunningInDocker } from './isRunningInDocker';

export function createAppDataSource(): DataSource {
    // const DB_HOST = isRunningInDocker() ? 'host.docker.internal' : 'localhost';
    const DB_HOST = '/cloudsql/hephaestus-418809:us-east1:hephaestus-postgres';

    return new DataSource({
        type: 'postgres',
        host: DB_HOST,
        port: 5433,
        username: 'hephaestus-db',
        password: decryptDbPassword(),
        database: 'postgres',
        synchronize: true,
        logging: false,
        entities: [User],
        migrations: [],
        subscribers: [],
    });
}
