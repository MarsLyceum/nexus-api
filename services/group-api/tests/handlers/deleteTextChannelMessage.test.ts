// tests/handlers/deleteTextChannelMessage.test.ts
import { Request } from 'express';
import {
    TypeOrmDataSourceSingleton,
    GoogleCloudStorageSingleton,
} from 'third-party-clients';
import {
    TextChannelMessageEntity,
    DeleteTextChannelMessageParams,
} from 'group-api-client';
import { deleteTextChannelMessage } from '../../src/handlers/deleteTextChannelMessage';
import { makeRes } from '../utils';

describe('deleteTextChannelMessage handler', () => {
    let fakeManager: {
        findOne: jest.Mock<
            Promise<{ attachmentFilePaths?: string[] } | null>,
            [typeof TextChannelMessageEntity, { where: { id: string } }]
        >;
        delete: jest.Mock<
            Promise<void>,
            [typeof TextChannelMessageEntity, { id: string }]
        >;
    };
    let fakeFile: { delete: jest.Mock<Promise<void>, []> };
    let fakeBucket: { file: jest.Mock<typeof fakeFile, [string]> };
    let storage: { bucket: jest.Mock<typeof fakeBucket, [string]> };
    let res = makeRes();

    beforeEach(() => {
        jest.resetAllMocks();

        // eslint-disable-next-line unicorn/no-useless-undefined
        fakeFile = { delete: jest.fn().mockResolvedValue(undefined) };
        fakeBucket = { file: jest.fn().mockReturnValue(fakeFile) };
        storage = { bucket: jest.fn().mockReturnValue(fakeBucket) };
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
        (GoogleCloudStorageSingleton.getInstance as jest.Mock).mockReturnValue(
            storage
        );

        fakeManager = {
            findOne: jest.fn(),
            // eslint-disable-next-line unicorn/no-useless-undefined
            delete: jest.fn().mockResolvedValue(undefined),
        };
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
        (TypeOrmDataSourceSingleton.getInstance as jest.Mock).mockResolvedValue(
            {
                manager: fakeManager,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } as any
        );

        res = makeRes();
    });

    it('removes attachments, deletes message, and returns 204', async () => {
        fakeManager.findOne.mockResolvedValue({
            attachmentFilePaths: ['file1.png', 'file2.jpg'],
        });

        const req = {
            params: { id: 'msg-123' },
        } as unknown as Request<
            DeleteTextChannelMessageParams,
            unknown,
            unknown
        >;

        await deleteTextChannelMessage(req, res);

        expect(storage.bucket).toHaveBeenCalledWith('message-attachments');
        expect(fakeBucket.file).toHaveBeenCalledWith('file1.png');
        expect(fakeBucket.file).toHaveBeenCalledWith('file2.jpg');
        expect(fakeFile.delete).toHaveBeenCalledTimes(2);

        expect(fakeManager.delete).toHaveBeenCalledWith(
            TextChannelMessageEntity,
            { id: 'msg-123' }
        );
        expect(res.status).toHaveBeenCalledWith(204);
        expect(res.send).toHaveBeenCalled();
    });

    it('skips file deletions if no attachments and still deletes message', async () => {
        fakeManager.findOne.mockResolvedValue({ attachmentFilePaths: [] });

        const req = {
            params: { id: 'msg-456' },
        } as unknown as Request<
            DeleteTextChannelMessageParams,
            unknown,
            unknown
        >;

        await deleteTextChannelMessage(req, res);

        expect(fakeBucket.file).not.toHaveBeenCalled();
        expect(fakeManager.delete).toHaveBeenCalledWith(
            TextChannelMessageEntity,
            { id: 'msg-456' }
        );
        expect(res.status).toHaveBeenCalledWith(204);
    });

    it('handles errors by logging and returning 500', async () => {
        const err = new Error('oops');
        fakeManager.findOne.mockRejectedValue(err);

        const consoleErrorSpy = jest
            .spyOn(console, 'error')
            .mockImplementation();

        const req = {
            params: { id: 'msg-789' },
        } as unknown as Request<
            DeleteTextChannelMessageParams,
            unknown,
            unknown
        >;

        await deleteTextChannelMessage(req, res);

        expect(consoleErrorSpy).toHaveBeenCalledWith(
            'Error deleting text channel message:',
            err
        );
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            message: 'Internal Server Error',
        });
    });
});
