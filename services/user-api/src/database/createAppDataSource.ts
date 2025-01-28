import 'reflect-metadata';
import { DataSource } from 'typeorm';

import { UserEntity } from 'user-api-client';
import { isRunningInCloudRun } from './isRunningInCloudRun';
import { DATABASE_NAME, DATABASE_USERNAME, DATABASE_PASSWORD } from '../config';

export function createAppDataSource(): DataSource {
    // const cloudDb = isRunningInCloudRun();
    // const localDbSettings = {
    //     url: `postgres://${DATABASE_USERNAME}:${DATABASE_PASSWORD}@127.0.0.1:5434/${DATABASE_NAME}`,
    // };
    // const hostSettings = cloudDb
    //     ? {
    //           url: `postgresql://postgres:${DATABASE_PASSWORD}@db.zrgnvlobrohtrrqeajhy.supabase.co:5432/postgres`,
    //       }
    //     : localDbSettings;
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
