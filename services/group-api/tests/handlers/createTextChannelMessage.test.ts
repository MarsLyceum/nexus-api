/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable unicorn/no-useless-undefined */
/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable @typescript-eslint/no-explicit-any */

import {
    TypeOrmDataSourceSingleton,
    GoogleCloudStorageSingleton,
    GooglePubSubClientSingleton,
} from 'third-party-clients';
import { GroupChannelEntity, GroupEntity } from 'group-api-client';

import { createTextChannelMessage } from '../../src/handlers';

import { makeRes, makeReq, stubDBWithChannel } from '../utils';

const CHANNEL_ID = '2377d366-681e-4e52-ae4b-9be5cf6bb400';
const GROUP_ID = '22e4e59c-e8a9-4092-b7d0-660c81c61d71';
const MEMBER1 = '9efa9f13-3b26-46dd-a397-4be5a5ff7963';
const MEMBER2 = '1e2f9be9-a1c3-4a88-8862-c4d34c564617';
const NOW_TS = 1_600_000_000_000; // for deterministic filePaths

let bucketMock: jest.Mock;
let fakeFile: { save: jest.Mock };

beforeEach(() => {
    jest.resetAllMocks();
    jest.spyOn(Date, 'now').mockReturnValue(NOW_TS);

    // Storage mock
    fakeFile = { save: jest.fn().mockResolvedValue(undefined) };
    const fakeBucket = { file: jest.fn().mockReturnValue(fakeFile) };
    bucketMock = jest.fn().mockReturnValue(fakeBucket);
    (GoogleCloudStorageSingleton.getInstance).mockReturnValue({
        bucket: bucketMock,
    });

    // PubSub mock
    const fakeTopic = { publishMessage: jest.fn().mockResolvedValue('msgId') };
    const fakePubsub = { topic: jest.fn().mockReturnValue(fakeTopic) };
    (GooglePubSubClientSingleton.getInstance).mockReturnValue(
        fakePubsub
    );
});

it('creates a message and publishes for each member when there are no files', async () => {
    const mockChannel = new GroupChannelEntity();
    mockChannel.id = CHANNEL_ID;
    mockChannel.group = {
        id: GROUP_ID,
        name: 'Test Channel',
        createdByUserId: MEMBER1,
        createdAt: new Date('2025-05-07T08:00:00.000Z'),
        channels: [],
        publicGroup: true,
        members: [
            {
                userId: MEMBER1,
                groupId: GROUP_ID,
                role: 'owner',
                joinedAt: new Date('2025-05-07T08:00:00.000Z'),
                group: new GroupEntity(),
            },
            {
                userId: MEMBER2,
                groupId: GROUP_ID,
                role: 'member',
                joinedAt: new Date('2025-06-07T08:00:00.000Z'),
                group: new GroupEntity(),
            },
        ],
    };

    const { fakeManager } = stubDBWithChannel(mockChannel);

    const req = makeReq({
        id: undefined,
        content: 'Hello world',
        channelId: CHANNEL_ID,
        postedByUserId: MEMBER1,
    });
    const res = makeRes();
    await createTextChannelMessage(req, res);

    // The id field passed to manager.create should be a valid UUID string
    expect(fakeManager.create).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({
            id: expect.stringMatching(
                /^[\da-f]{8}-[\da-f]{4}-4[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/
            ),
            content: 'Hello world',
            channelId: CHANNEL_ID,
            postedByUserId: MEMBER1,
            attachmentFilePaths: [],
            edited: false,
            channel: mockChannel,
        })
    );

    expect(res.status).toHaveBeenCalledWith(201);

    const pubsub = GooglePubSubClientSingleton.getInstance();
    expect(pubsub.topic).toHaveBeenCalledWith(`u-${MEMBER1}`);
    expect(pubsub.topic).toHaveBeenCalledWith(`u-${MEMBER2}`);
});

it('uses provided id instead of generating a new one', async () => {
    const mockChannel = new GroupChannelEntity();
    mockChannel.id = CHANNEL_ID;
    mockChannel.group = { ...mockChannel.group, members: [] };

    const { fakeManager } = stubDBWithChannel(mockChannel);

    const CUSTOM_ID = '123e4567-e89b-12d3-a456-426614174000';
    const req = makeReq({
        id: CUSTOM_ID,
        content: 'With custom id',
        channelId: CHANNEL_ID,
        postedByUserId: MEMBER1,
    });
    const res = makeRes();
    await createTextChannelMessage(req, res);

    expect(fakeManager.create).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({ id: CUSTOM_ID })
    );
});

it('uploads attachments before creating message', async () => {
    const mockChannel = new GroupChannelEntity();
    mockChannel.id = CHANNEL_ID;
    mockChannel.group = new GroupEntity();
    stubDBWithChannel(mockChannel);

    const files = {
        attachments: [
            { buffer: Buffer.from('a'), mimetype: 'image/png' },
            { buffer: Buffer.from('b'), mimetype: 'image/jpeg' },
        ],
    };
    const req = makeReq(
        { channelId: CHANNEL_ID, content: '', postedByUserId: MEMBER1 },
        files
    );
    const res = makeRes();
    await createTextChannelMessage(req, res);

    expect(bucketMock).toHaveBeenCalledWith('message-attachments');

    const fakeBucket = bucketMock('message-attachments') as { file: jest.Mock };
    expect(fakeBucket.file).toHaveBeenCalledTimes(2);
    expect(fakeBucket.file).toHaveBeenNthCalledWith(1, `${NOW_TS}_0`);
    expect(fakeBucket.file).toHaveBeenNthCalledWith(2, `${NOW_TS}_1`);

    const firstFileObj = fakeBucket.file.mock.results[0].value;
    const secondFileObj = fakeBucket.file.mock.results[1].value;
    expect(firstFileObj.save).toHaveBeenCalledWith(
        Buffer.from('a'),
        expect.objectContaining({ metadata: { contentType: 'image/png' } })
    );
    expect(secondFileObj.save).toHaveBeenCalledWith(
        Buffer.from('b'),
        expect.objectContaining({ metadata: { contentType: 'image/jpeg' } })
    );
});

it('returns 404 when channel id is invalid', async () => {
    (TypeOrmDataSourceSingleton.getInstance).mockResolvedValue({
        manager: {
            transaction: () => {
                throw new Error('Invalid channel id');
            },
        },
    });

    const req = makeReq({
        channelId: CHANNEL_ID,
        content: '',
        postedByUserId: MEMBER1,
    });
    const res = makeRes();
    await createTextChannelMessage(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid channel id' });
});

it('handles unexpected errors with 500', async () => {
    (TypeOrmDataSourceSingleton.getInstance).mockResolvedValue({
        manager: {
            transaction: () => {
                throw new Error('something broke');
            },
        },
    });

    const req = makeReq({
        channelId: CHANNEL_ID,
        content: '',
        postedByUserId: MEMBER1,
    });
    const res = makeRes();
    await createTextChannelMessage(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith('something broke');
});

it('returns 404 when manager.findOne returns null inside transaction', async () => {
    // simulate missing channel inside the transaction
    const fakeManager = {
        findOne: jest.fn().mockResolvedValue(null),
        create: jest.fn(),
        save: jest.fn(),
    };
    (TypeOrmDataSourceSingleton.getInstance).mockResolvedValue({
        manager: {
            transaction: (cb: any) => cb(fakeManager),
            findOne: fakeManager.findOne,
        },
    });

    const req = makeReq({
        channelId: 'not-found',
        content: '',
        postedByUserId: '',
    });
    const res = makeRes();
    await createTextChannelMessage(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid channel id' });
});

it('skips publishing when no groupChannel is found after transaction', async () => {
    // stub a valid channel inside the transaction
    const mockChannel = new GroupChannelEntity();
    mockChannel.id = CHANNEL_ID;
    mockChannel.group = new GroupEntity();

    // stub dataSource: transaction sees mockChannel, outer findOne returns null
    const fakeManagerTx = {
        findOne: jest.fn().mockResolvedValue(mockChannel),
        create: jest.fn().mockReturnValue(undefined),
        save: jest.fn().mockResolvedValue(undefined),
    };
    const fakeDataSource = {
        manager: {
            transaction: (cb: any) => cb(fakeManagerTx),
            findOne: jest.fn().mockResolvedValue(null),
        },
    };
    (TypeOrmDataSourceSingleton.getInstance).mockResolvedValue(
        fakeDataSource
    );

    // run handler
    const req = makeReq({
        id: undefined,
        content: 'No publish',
        channelId: CHANNEL_ID,
        postedByUserId: MEMBER1,
    });
    const res = makeRes();
    await createTextChannelMessage(req, res);

    // we still get 201 and the message
    expect(res.status).toHaveBeenCalledWith(201);

    // but pubsub.topic should never be called
    const pubsub = GooglePubSubClientSingleton.getInstance();
    expect(pubsub.topic).not.toHaveBeenCalled();
});
