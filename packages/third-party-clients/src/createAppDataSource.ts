import 'reflect-metadata';
import { DataSource } from 'typeorm';

import {
    GroupEntity,
    GroupMemberEntity,
    GroupChannelEntity,
    TextChannelMessageEntity,
    FeedChannelPostEntity,
    FeedChannelPostCommentEntity,
} from 'group-api-client';
import { UserEntity } from 'user-api-client';
import { FriendEntity } from 'friends-api-client';
import { ConversationEntity, MessageEntity } from 'direct-messaging-api-client';
import { DATABASE_PASSWORD } from './config';

export function createAppDataSource(): DataSource {
    const hostSettings = {
        // connection pool
        // url: `postgresql://postgres.zrgnvlobrohtrrqeajhy:${DATABASE_PASSWORD}@aws-0-us-west-1.pooler.supabase.com:6543/postgres`,

        // url: `postgresql://postgres.zrgnvlobrohtrrqeajhy:${DATABASE_PASSWORD}@aws-0-us-west-1.pooler.supabase.com:5432/postgres`,
        // url: `postgresql://neondb_owner:npg_bzLpFP4uB1kg@ep-holy-wildflower-a6mzv7uo-pooler.us-west-2.aws.neon.tech/neondb?sslmode=require`,,
        url: `postgres://postgres:${DATABASE_PASSWORD}@34.169.241.220:5432/postgres`,
    };

    // const caCert = fs.readFileSync('../../certs/prod-ca-2021.crt').toString();

    return new DataSource({
        type: 'postgres',
        ...hostSettings,
        synchronize: false,
        migrationsRun: false,
        logging: true,
        entities: [
            // direct messaging api
            ConversationEntity,
            MessageEntity,
            // friends api
            FriendEntity,
            // user api
            UserEntity,
            // group api
            GroupEntity,
            GroupMemberEntity,
            GroupChannelEntity,
            TextChannelMessageEntity,
            FeedChannelPostEntity,
            FeedChannelPostCommentEntity,
        ],
        migrations: ['migrations/**/*.ts'],
        subscribers: [],
        cache: {
            duration: 60_000,
        },
        extra: {
            max: 10, // Maximum number of connections in the pool
            idleTimeoutMillis: 60_000, // How long a client is allowed to remain idle before being closed
            ssl: {
                rejectUnauthorized: false, // adjust this if you need strict certificate validation
                // ca: caCert,
            },
            options: '-c timezone=UTC',
        },
    });
}

export const DATA_SOURCE = createAppDataSource();
