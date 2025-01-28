import 'reflect-metadata';
import { DataSource } from 'typeorm';

import { UserEntity } from 'user-api-client';
import { DATABASE_PASSWORD } from '../config';

export function createAppDataSource(): DataSource {
    const hostSettings = {
        url: `postgresql://postgres.zrgnvlobrohtrrqeajhy:${DATABASE_PASSWORD}@aws-0-us-west-1.pooler.supabase.com:6543/postgres`,
    };

    return new DataSource({
        type: 'postgres',
        ...hostSettings,
        synchronize: false,
        logging: true,
        entities: [UserEntity],
        migrations: ['migrations/**/*.ts'],
        subscribers: [],
    });
}

export const DATA_SOURCE = createAppDataSource();
