// tests/utils.ts

/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable unicorn/no-useless-undefined */

import { Request, Response } from 'express';
import { TypeOrmDataSourceSingleton } from 'third-party-clients';
import { GroupChannelEntity } from 'group-api-client';

export type ResSpy = { status: jest.Mock; json: jest.Mock; send: jest.Mock };

export function makeRes(): ResSpy & Response {
    const status = jest.fn().mockReturnThis();
    const json = jest.fn().mockReturnThis();
    const send = jest.fn().mockReturnThis();
    return { status, json, send } as any;
}

export function makeReq<T>(body: T, files?: any): Request {
    return { body, files } as any;
}

export function stubDBWithChannel(channel: GroupChannelEntity) {
    const fakeManager = {
        findOne: jest.fn().mockResolvedValue(channel),
        create: jest.fn((_, data) => data),
        save: jest.fn().mockResolvedValue(undefined),
    };
    const fakeDataSource = {
        manager: {
            transaction: (cb: (m: typeof fakeManager) => any) =>
                cb(fakeManager),
            findOne: fakeManager.findOne,
        },
    };
    (TypeOrmDataSourceSingleton.getInstance as jest.Mock).mockResolvedValue(
        fakeDataSource
    );
    return { fakeManager };
}
