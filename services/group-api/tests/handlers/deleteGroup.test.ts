/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable unicorn/no-useless-undefined */
/* eslint-disable @typescript-eslint/no-explicit-any */

import {
    GroupEntity,
    GroupChannelEntity,
    FeedChannelPostEntity,
    FeedChannelPostCommentEntity,
    TextChannelMessageEntity,
    GroupMemberEntity,
} from 'group-api-client';
import {
    TypeOrmDataSourceSingleton,
    GoogleCloudStorageSingleton,
} from 'third-party-clients';

import { makeRes } from '../utils';
import { deleteGroup } from '../../src/handlers/deleteGroup';

describe('deleteGroup handler', () => {
    let initialManager: {
        findOne: jest.Mock;
        transaction: jest.Mock;
    };
    let txManager: {
        find: jest.Mock;
        createQueryBuilder: jest.Mock;
        delete: jest.Mock;
    };
    let fakeDataSource: { manager: any };
    let postBuilder: { where: jest.Mock; getMany: jest.Mock };
    let bucketMock: jest.Mock;
    let fileMock: { delete: jest.Mock };

    beforeEach(() => {
        jest.resetAllMocks();

        initialManager = {
            findOne: jest.fn(),
            transaction: jest.fn(),
        };
        txManager = {
            find: jest.fn(),
            createQueryBuilder: jest.fn(),
            delete: jest.fn(),
        };
        // eslint-disable-next-line @typescript-eslint/require-await
        initialManager.transaction.mockImplementation(async (cb) =>
            cb(txManager)
        );

        fakeDataSource = { manager: initialManager };
        (TypeOrmDataSourceSingleton.getInstance as jest.Mock).mockResolvedValue(
            fakeDataSource
        );

        postBuilder = {
            where: jest.fn().mockReturnThis(),
            getMany: jest.fn(),
        };
        txManager.createQueryBuilder.mockReturnValue(postBuilder);

        fileMock = { delete: jest.fn().mockResolvedValue(undefined) };
        bucketMock = jest
            .fn()
            .mockReturnValue({ file: jest.fn().mockReturnValue(fileMock) });
        (GoogleCloudStorageSingleton.getInstance as jest.Mock).mockReturnValue({
            bucket: bucketMock,
        });
    });

    it('returns 400 if id missing', async () => {
        const req = { params: {} } as any;
        const res = makeRes();

        await deleteGroup(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith('Group id parameter is missing');
    });

    it('returns 404 if group not found', async () => {
        initialManager.findOne.mockResolvedValueOnce(null);

        const req = { params: { id: 'g1' } } as any;
        const res = makeRes();

        await deleteGroup(req, res);

        expect(initialManager.findOne).toHaveBeenCalledWith(GroupEntity, {
            where: { id: 'g1' },
            relations: ['channels'],
        });
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.send).toHaveBeenCalledWith('Group not found');
    });

    it('deletes group with no channels and no avatar and returns 204', async () => {
        const group = { id: 'g1' } as GroupEntity;
        initialManager.findOne.mockResolvedValueOnce(group);
        txManager.find.mockResolvedValueOnce([]);

        const req = { params: { id: 'g1' } } as any;
        const res = makeRes();

        await deleteGroup(req, res);

        expect(txManager.find).toHaveBeenCalledWith(GroupChannelEntity, {
            where: { group: { id: 'g1' } },
        });
        expect(txManager.delete).toHaveBeenCalledWith(GroupMemberEntity, {
            group: { id: 'g1' },
        });
        expect(txManager.delete).toHaveBeenCalledWith(GroupEntity, {
            id: 'g1',
        });
        expect(bucketMock).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(204);
        expect(res.send).toHaveBeenCalled();
    });

    it('deletes channels, posts, comments, messages, members, group and avatar', async () => {
        const group = { id: 'g1', avatarFilePath: 'avatar.png' } as GroupEntity;
        initialManager.findOne.mockResolvedValueOnce(group);
        txManager.find.mockResolvedValueOnce([
            { id: 'c1' },
        ] as GroupChannelEntity[]);
        postBuilder.getMany.mockResolvedValueOnce([
            { id: 'p1' },
        ] as FeedChannelPostEntity[]);

        const req = { params: { id: 'g1' } } as any;
        const res = makeRes();

        await deleteGroup(req, res);

        expect(txManager.find).toHaveBeenCalledWith(GroupChannelEntity, {
            where: { group: { id: 'g1' } },
        });

        expect(txManager.createQueryBuilder).toHaveBeenCalledWith(
            FeedChannelPostEntity,
            'post'
        );
        expect(postBuilder.where).toHaveBeenCalledWith(
            'post.channelId IN (:...ids)',
            { ids: ['c1'] }
        );
        expect(postBuilder.getMany).toHaveBeenCalled();

        expect(txManager.delete).toHaveBeenNthCalledWith(
            1,
            FeedChannelPostCommentEntity,
            expect.objectContaining({ postId: expect.anything() })
        );
        expect(txManager.delete).toHaveBeenNthCalledWith(
            2,
            FeedChannelPostEntity,
            expect.objectContaining({ channelId: expect.anything() })
        );
        expect(txManager.delete).toHaveBeenNthCalledWith(
            3,
            TextChannelMessageEntity,
            expect.objectContaining({ channelId: expect.anything() })
        );
        expect(txManager.delete).toHaveBeenNthCalledWith(
            4,
            GroupChannelEntity,
            expect.objectContaining({ id: expect.anything() })
        );
        expect(txManager.delete).toHaveBeenCalledWith(GroupMemberEntity, {
            group: { id: 'g1' },
        });
        expect(txManager.delete).toHaveBeenCalledWith(GroupEntity, {
            id: 'g1',
        });

        expect(bucketMock).toHaveBeenCalledWith('group-avatars');
        expect(bucketMock('group-avatars').file).toHaveBeenCalledWith(
            'avatar.png'
        );
        expect(fileMock.delete).toHaveBeenCalled();

        expect(res.status).toHaveBeenCalledWith(204);
        expect(res.send).toHaveBeenCalled();
    });

    it('returns 500 on unexpected error', async () => {
        initialManager.findOne.mockRejectedValueOnce(new Error('boom'));

        const req = { params: { id: 'g1' } } as any;
        const res = makeRes();

        await deleteGroup(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith('boom');
    });
});
