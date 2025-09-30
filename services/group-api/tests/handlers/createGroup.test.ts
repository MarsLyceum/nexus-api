/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable unicorn/no-useless-undefined */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { Buffer } from 'node:buffer';
import {
    GroupEntity,
    GroupMemberEntity,
    GroupChannelEntity,
} from 'group-api-client';
import {
    GoogleCloudStorageSingleton,
    TypeOrmDataSourceSingleton,
} from 'third-party-clients';
import { createGroup } from '../../src/handlers';
import { makeReq, makeRes } from '../utils';

describe('createGroup handler', () => {
    let bucketMock: jest.Mock;
    let saveMock: jest.Mock;

    beforeEach(() => {
        jest.resetAllMocks();
        // Freeze Date.now() for predictable avatarFilePath
        jest.spyOn(Date, 'now').mockReturnValue(1_600_000_000_000);
    });

    it('creates group + owner + general + feed channel without avatar', async () => {
        const fakeManager = {
            create: jest
                .fn()
                // 1st call: GroupEntity
                .mockReturnValueOnce({
                    id: 'g1',
                    name: 'My Group',
                } as GroupEntity)
                // 2nd: GroupMemberEntity
                .mockReturnValueOnce({
                    userId: 'u1',
                    role: 'owner',
                } as GroupMemberEntity)
                // 3rd: general channel
                .mockReturnValueOnce({
                    name: 'general',
                    type: 'text',
                } as GroupChannelEntity)
                // 4th: feed channel
                .mockReturnValueOnce({
                    name: 'feed',
                    type: 'feed',
                } as GroupChannelEntity),
            save: jest.fn().mockResolvedValue(undefined),
        };

        (TypeOrmDataSourceSingleton.getInstance).mockResolvedValue(
            {
                manager: {
                    transaction: (cb: any) => cb(fakeManager),
                },
            }
        );

        const req = makeReq({
            name: 'My Group',
            createdByUserId: 'u1',
            publicGroup: true,
        });
        const res = makeRes();
        await createGroup(req, res);

        // Expect 4 creates + 4 saves
        expect(fakeManager.create).toHaveBeenCalledTimes(4);
        expect(fakeManager.save).toHaveBeenCalledTimes(4);

        // The first create returned the GroupEntity, so that's what we JSON back
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith({ id: 'g1', name: 'My Group' });
    });

    it('uploads avatar when req.file is present', async () => {
        // stub storage
        saveMock = jest.fn().mockResolvedValue(undefined);
        const fileMock = jest.fn().mockReturnValue({ save: saveMock });
        bucketMock = jest.fn().mockReturnValue({ file: fileMock });
        (GoogleCloudStorageSingleton.getInstance).mockReturnValue({
            bucket: bucketMock,
        });

        // stub DB
        const fakeManager = {
            create: jest.fn().mockReturnValue({} as any),
            save: jest.fn().mockResolvedValue(undefined),
        };
        (TypeOrmDataSourceSingleton.getInstance).mockResolvedValue(
            {
                manager: { transaction: (cb: any) => cb(fakeManager) },
            }
        );

        // simulate file upload
        const avatarBuffer = Buffer.from('pngdata');
        const fakeFile: Express.Multer.File = {
            fieldname: 'avatar',
            originalname: 'pic.png',
            encoding: '7bit',
            mimetype: 'image/png',
            size: avatarBuffer.length,
            destination: '',
            filename: '',
            path: '',
            buffer: avatarBuffer,
        } as Express.Multer.File;
        const req = makeReq({
            name: 'G',
            createdByUserId: 'u2',
            publicGroup: false,
        });
        req.file = fakeFile;
        const res = makeRes();
        await createGroup(req, res);

        // should upload to 'group-avatars' with filePath = `${Date.now()}`
        expect(bucketMock).toHaveBeenCalledWith('group-avatars');
        expect(fileMock).toHaveBeenCalledWith('1600000000000');
        expect(saveMock).toHaveBeenCalledWith(avatarBuffer, {
            metadata: { contentType: 'image/png' },
        });

        // still returns 201
        expect(res.status).toHaveBeenCalledWith(201);
    });

    it('returns 500 when transaction throws', async () => {
        (TypeOrmDataSourceSingleton.getInstance).mockResolvedValue(
            {
                manager: {
                    transaction: () => {
                        throw new Error('fail!');
                    },
                },
            }
        );

        const req = makeReq({
            name: 'X',
            createdByUserId: 'u3',
            publicGroup: true,
        });
        const res = makeRes();
        await createGroup(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith('fail!');
    });
});
