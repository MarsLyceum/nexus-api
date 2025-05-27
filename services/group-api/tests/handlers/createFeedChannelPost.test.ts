/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable unicorn/no-useless-undefined */

// createFeedChannelPost.test.ts
import {
    TypeOrmDataSourceSingleton,
    GoogleCloudStorageSingleton,
    GooglePubSubClientSingleton,
} from 'third-party-clients';
import { GroupChannelEntity, GroupEntity } from 'group-api-client';

import { createFeedChannelPost } from '../../src/handlers';

import { makeRes, makeReq, stubDBWithChannel } from '../utils';

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
    const CHANNEL_ID = '2377d366-681e-4e52-ae4b-9be5cf6bb400';
    const MEMBER1 = '9efa9f13-3b26-46dd-a397-4be5a5ff7963';
    mockChannel.id = CHANNEL_ID;
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

    stubDBWithChannel(mockChannel);

    const req = makeReq({
        content: 'hey',
        channelId: CHANNEL_ID,
        postedByUserId: '9efa9f13-3b26-46dd-a397-4be5a5ff7963',
    });
    const res = makeRes();

    await createFeedChannelPost(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
            id: expect.stringMatching(
                /^[\da-f]{8}-[\da-f]{4}-4[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/
            ),
            content: 'hey',
            channelId: CHANNEL_ID,
            postedByUserId: MEMBER1,
            attachmentFilePaths: [],
            edited: false,
            channel: mockChannel,
        })
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

it('returns 404 when the channel id is not found inside the transaction', async () => {
    // Stub getInstance so that inside transaction, findOne returns null
    (TypeOrmDataSourceSingleton.getInstance as jest.Mock).mockResolvedValue({
        manager: {
            transaction: (cb: any) =>
                cb({
                    findOne: jest.fn().mockResolvedValue(null),
                    create: jest.fn(),
                    save: jest.fn(),
                }),
        },
    });

    const req = makeReq({
        content: '',
        channelId: 'nonexistent',
        postedByUserId: 'user-x',
    });
    const res = makeRes();

    await createFeedChannelPost(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid channel id' });
});

it('skips publishing when post is created but groupChannel is null on second lookup', async () => {
    // Arrange: transaction succeeds, but outer findOne returns null
    const fakeManagerTx = {
        findOne: jest.fn().mockResolvedValue(
            // inside transaction we need a valid channel so create succeeds
            new GroupChannelEntity()
        ),
        create: jest.fn().mockReturnValue({ foo: 'bar' } as any),
        save: jest.fn().mockResolvedValue(undefined),
    };

    const fakeDataSource = {
        manager: {
            // first, use fakeManagerTx for transaction
            transaction: (cb: any) => cb(fakeManagerTx),
            // then, simulate groupChannel lookup returning null
            findOne: jest.fn().mockResolvedValue(null),
        },
    };
    (TypeOrmDataSourceSingleton.getInstance as jest.Mock).mockResolvedValue(
        fakeDataSource
    );

    // Act
    const req = makeReq({
        content: 'hey',
        channelId: 'chan-1',
        postedByUserId: 'u1',
    });
    const res = makeRes();
    await createFeedChannelPost(req, res);

    // Assert: post was created and returned
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ foo: 'bar' });

    // And because groupChannel is null, we never publish
    const pubsub = GooglePubSubClientSingleton.getInstance();
    expect(pubsub.topic).not.toHaveBeenCalled();
});
