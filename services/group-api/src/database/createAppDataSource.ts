import 'reflect-metadata';
import { DataSource } from 'typeorm';

import {
    GroupEntity,
    GroupMemberEntity,
    GroupChannelEntity,
    GroupChannelMessageEntity,
    GroupChannelPostEntity,
    GroupChannelPostCommentEntity,
} from 'group-api-client';
import { DATABASE_PASSWORD } from '../config';

export function createAppDataSource(): DataSource {
    const hostSettings = {
        url: `postgresql://postgres.zrgnvlobrohtrrqeajhy:${DATABASE_PASSWORD}@aws-0-us-west-1.pooler.supabase.com:6543/postgres`,
    };

    return new DataSource({
        type: 'postgres',
        ...hostSettings,
        synchronize: true,
        logging: true,
        entities: [
            GroupEntity,
            GroupMemberEntity,
            GroupChannelEntity,
            GroupChannelMessageEntity,
            GroupChannelPostEntity,
            GroupChannelPostCommentEntity,
        ],
        migrations: ['migrations/**/*.ts'],
        subscribers: [],
    });
}

export const DATA_SOURCE = createAppDataSource();
