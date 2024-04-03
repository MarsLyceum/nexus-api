import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { User } from '../db_models/User';
import { decryptDbPassword } from './decryptPassword';
import { getCurrentIPAddress } from './getCurrentIPAddress';

export async function createAppDataSource(): Promise<DataSource> {
    const DB_HOST = await getCurrentIPAddress();

    return new DataSource({
        type: 'postgres',
        host: DB_HOST,
        port: 5433,
        username: 'postgres',
        password: decryptDbPassword(),
        database: 'postgres',
        synchronize: true,
        logging: false,
        entities: [User],
        migrations: [],
        subscribers: [],
    });
}
