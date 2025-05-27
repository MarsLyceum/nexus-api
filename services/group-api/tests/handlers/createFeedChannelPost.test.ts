// eslint-disable-next-line eslint-comments/disable-enable-pair
/* eslint-disable @typescript-eslint/unbound-method */
// eslint-disable-next-line eslint-comments/disable-enable-pair
/* eslint-disable @typescript-eslint/no-explicit-any */

// createFeedChannelPost.test.ts
import { Request, Response } from 'express';
import {
    TypeOrmDataSourceSingleton,
    GoogleCloudStorageSingleton,
    GooglePubSubClientSingleton,
} from 'third-party-clients';
import { GroupChannelEntity, GroupEntity } from 'group-api-client';

import { createFeedChannelPost } from '../../src/handlers';

type ResSpy = {
    status: jest.Mock;
    json: jest.Mock;
    send: jest.Mock;
};

function makeRes(): ResSpy & Response {
    const status = jest.fn().mockReturnThis();
    const json = jest.fn().mockReturnThis();
    const send = jest.fn().mockReturnThis();
    return { status, json, send } as any;
}

function makeReq<T>(body: T, files?: any): Request {
    return { body, files } as any;
}

beforeEach(() => {
    jest.resetAllMocks();

    // fake dataSource.manager.transaction
    const fakeManager = {
        findOne: jest.fn(),
        create: jest.fn(),
        save: jest.fn(),
    };
    const fakeDataSource = {
        manager: {
            // first call: transaction(cb) => cb(fakeManager)
            transaction: (cb: (m: typeof fakeManager) => any) =>
                cb(fakeManager),
            // second call: manager.findOne(...) => mockChannel
            findOne: fakeManager.findOne,
        },
    };
    (TypeOrmDataSourceSingleton.getInstance as jest.Mock).mockResolvedValue(
        fakeDataSource
    );

    // fake storage bucket
    // eslint-disable-next-line unicorn/no-useless-undefined
    const fakeFile = { save: jest.fn().mockResolvedValue(undefined) };
    const bucketMock = jest.fn().mockReturnValue({
        file: jest.fn().mockReturnValue(fakeFile),
    });
    (GoogleCloudStorageSingleton.getInstance as jest.Mock).mockReturnValue({
        bucket: bucketMock,
    });

    // fake pubsub
    const fakeTopic = { publishMessage: jest.fn().mockResolvedValue('msgId') };
    const fakePubsub = { topic: jest.fn().mockReturnValue(fakeTopic) };
    GooglePubSubClientSingleton.getInstance.mockReturnValue(fakePubsub);
});

it('creates a post and publishes for each member when there are no files', async () => {
    const mockChannel = new GroupChannelEntity();
    mockChannel.id = 'chan-1';
    mockChannel.group = {
        id: '22e4e59c-e8a9-4092-b7d0-660c81c61d71',
        name: 'my group',
        createdByUserId: '9efa9f13-3b26-46dd-a397-4be5a5ff7963',
        createdAt: new Date(2025, 4, 7, 8, 0, 0, 0),
        channels: [],
        publicGroup: true,
        members: [
            {
                userId: '9efa9f13-3b26-46dd-a397-4be5a5ff7963',
                groupId: '22e4e59c-e8a9-4092-b7d0-660c81c61d71',
                role: 'owner',
                joinedAt: new Date(2025, 4, 7, 8, 0, 0, 0),
                group: new GroupEntity(),
            },
            {
                userId: '1e2f9be9-a1c3-4a88-8862-c4d34c564617',
                groupId: '22e4e59c-e8a9-4092-b7d0-660c81c61d71',
                role: 'member',
                joinedAt: new Date(2025, 5, 7, 8, 0, 0, 0),
                group: new GroupEntity(),
            },
        ],
    };

    // manager.findOne first in transaction
    (TypeOrmDataSourceSingleton.getInstance as jest.Mock).mockResolvedValue({
        manager: {
            transaction: (cb: any) =>
                cb({
                    findOne: jest.fn().mockResolvedValue(mockChannel),
                    create: jest.fn().mockReturnValue({ foo: 'bar' } as any),
                    save: jest.fn(),
                }),
            findOne: jest.fn().mockResolvedValue(mockChannel),
        },
    });

    const req = makeReq({
        content: 'hey',
        channelId: 'chan-1',
        postedByUserId: '9efa9f13-3b26-46dd-a397-4be5a5ff7963',
    });
    const res = makeRes();

    await createFeedChannelPost(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ foo: 'bar' })
    );
    // each member got a publish
    const pubsub = GooglePubSubClientSingleton.getInstance();
    expect(pubsub.topic).toHaveBeenCalledWith(
        'u-9efa9f13-3b26-46dd-a397-4be5a5ff7963'
    );
    expect(pubsub.topic).toHaveBeenCalledWith(
        'u-1e2f9be9-a1c3-4a88-8862-c4d34c564617'
    );
});

it('returns 404 when channel is invalid', async () => {
    // transaction callback throws invalid id
    TypeOrmDataSourceSingleton.getInstance.mockResolvedValue({
        manager: {
            transaction: () => {
                throw new Error('Invalid channel id');
            },
        },
    });

    const req = makeReq({ channelId: 'bad', content: '', postedByUserId: '' });
    const res = makeRes();

    await createFeedChannelPost(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid channel id' });
});

it('uploads each attachment before creating post', async () => {
    // stub valid channel again
    const mockChannel = new GroupChannelEntity();
    mockChannel.id = '2377d366-681e-4e52-ae4b-9be5cf6bb400';
    mockChannel.group = new GroupEntity();
    TypeOrmDataSourceSingleton.getInstance.mockResolvedValue({
        manager: {
            transaction: (
                cb: (arg0: {
                    findOne: jest.Mock<any, any, any>;
                    create: jest.Mock<any, any, any>;
                    save: jest.Mock<any, any, any>;
                }) => any
            ) =>
                cb({
                    findOne: jest.fn().mockResolvedValue(mockChannel),
                    create: jest.fn().mockReturnValue({}),
                    save: jest.fn(),
                }),
        },
    });

    const files = {
        attachments: [
            { buffer: Buffer.from('a'), mimetype: 'image/png' },
            { buffer: Buffer.from('b'), mimetype: 'image/jpeg' },
        ],
    };
    const req = makeReq(
        { channelId: 'c', content: '', postedByUserId: '' },
        files
    );
    const res = makeRes();

    await createFeedChannelPost(req, res);

    const storage = GoogleCloudStorageSingleton.getInstance();
    const fakeBucket = storage.bucket('nexus-post-attachments');

    // bucket('nexus-post-attachments') called once
    expect(storage.bucket).toHaveBeenCalledWith('nexus-post-attachments');
    // file().save for each attachment
    expect(fakeBucket.file).toHaveBeenCalledTimes(2);

    const firstFileObj = fakeBucket.file.mock.results[0].value;
    expect(firstFileObj.save).toHaveBeenCalledWith(
        expect.any(Buffer),
        expect.objectContaining({ metadata: { contentType: 'image/png' } })
    );
});
