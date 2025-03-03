import 'reflect-metadata';
import { DataSource } from 'typeorm';

import {
    GroupEntity,
    GroupMemberEntity,
    GroupChannelEntity,
    GroupChannelMessageEntity,
    GroupChannelPostEntity,
    GroupChannelPostCommentEntity,
    GroupChannelMessageMessageEntity,
} from 'group-api-client';
import { DATABASE_PASSWORD } from '../config';

export function createAppDataSource(): DataSource {
    const hostSettings = {
        url: `postgresql://postgres.zrgnvlobrohtrrqeajhy:${DATABASE_PASSWORD}@aws-0-us-west-1.pooler.supabase.com:6543/postgres`,
    };

    return new DataSource({
        type: 'postgres',
        ...hostSettings,
        synchronize: false,
        migrationsRun: false,
        logging: true,
        entities: [
            GroupEntity,
            GroupMemberEntity,
            GroupChannelEntity,
            GroupChannelMessageEntity,
            GroupChannelPostEntity,
            GroupChannelPostCommentEntity,
            GroupChannelMessageMessageEntity,
        ],
        migrations: ['migrations/**/*.ts'],
        subscribers: [],
        cache: {
            duration: 60_000,
        },
        extra: {
            max: 10, // Maximum number of connections in the pool
            idleTimeoutMillis: 30_000, // How long a client is allowed to remain idle before being closed
        },
    });
}

export const DATA_SOURCE = createAppDataSource();
