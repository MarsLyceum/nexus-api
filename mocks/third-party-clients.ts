// mocks/third-party-clients.ts

const fakeFile = {
    // eslint-disable-next-line unicorn/no-useless-undefined
    save: jest.fn().mockResolvedValue(undefined),
};

const fakeBucket = {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    file: jest.fn().mockImplementation((_: string) => fakeFile),
};

export const GoogleCloudStorageSingleton = {
    getInstance: jest.fn().mockReturnValue({
        bucket: jest.fn().mockReturnValue(fakeBucket),
    }),
};

const fakeTopic = {
    publishMessage: jest.fn().mockResolvedValue('msgId'),
};

const fakePubsub = {
    topic: jest.fn().mockReturnValue(fakeTopic),
};

export const GooglePubSubClientSingleton = {
    getInstance: jest.fn().mockReturnValue(fakePubsub),
};

export const TypeOrmDataSourceSingleton = {
    getInstance: jest.fn(),
};

export const RedisClientSingleton = {
    getInstance: jest.fn(),
};

export const DATA_SOURCE = () => {};
