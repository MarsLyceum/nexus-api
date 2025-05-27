/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable unicorn/no-useless-undefined */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { TypeOrmDataSourceSingleton } from 'third-party-clients';
import { FeedChannelPostCommentEntity } from 'group-api-client';

import { makeRes } from '../utils';
import { getPostComments } from '../../src/handlers/getPostComments';

describe('getPostComments handler', () => {
    let builder: {
        where: jest.Mock;
        andWhere: jest.Mock;
        orderBy: jest.Mock;
        skip: jest.Mock;
        take: jest.Mock;
        getMany: jest.Mock;
    };
    let fakeCreateQueryBuilder: jest.Mock;
    let fakeFind: jest.Mock;

    beforeEach(() => {
        jest.resetAllMocks();

        builder = {
            where: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            orderBy: jest.fn().mockReturnThis(),
            skip: jest.fn().mockReturnThis(),
            take: jest.fn().mockReturnThis(),
            getMany: jest.fn(),
        };
        fakeCreateQueryBuilder = jest.fn().mockReturnValue(builder);
        fakeFind = jest.fn();

        const fakeDataSource = {
            manager: {
                createQueryBuilder: fakeCreateQueryBuilder,
                find: fakeFind,
            },
        };
        (TypeOrmDataSourceSingleton.getInstance as jest.Mock).mockResolvedValue(
            fakeDataSource
        );
    });

    it('returns 400 when postId is missing', async () => {
        const req = { params: {}, query: {} } as any;
        const res = makeRes();

        await getPostComments(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith('Post ID is required');
    });

    it('fetches top-level comments with default pagination and no replies', async () => {
        const initial: FeedChannelPostCommentEntity[] = [];
        builder.getMany.mockResolvedValueOnce(initial);
        fakeFind.mockResolvedValue([]); // no replies

        const req = { params: { postId: 'p1' }, query: {} } as any;
        const res = makeRes();

        await getPostComments(req, res);

        expect(fakeCreateQueryBuilder).toHaveBeenCalledWith(
            FeedChannelPostCommentEntity,
            'comment'
        );
        expect(builder.where).toHaveBeenCalledWith('comment.postId = :postId', {
            postId: 'p1',
        });
        expect(builder.andWhere).toHaveBeenCalledWith(
            'comment.parentCommentId IS NULL'
        );
        expect(builder.orderBy).toHaveBeenCalledWith(
            'comment.postedAt',
            'DESC'
        );
        expect(builder.skip).toHaveBeenCalledWith(0);
        expect(builder.take).toHaveBeenCalledWith(50);
        expect(builder.getMany).toHaveBeenCalled();

        // since no initial comments, fetchReplies never invoked
        expect(fakeFind).not.toHaveBeenCalled();

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(initial);
    });

    it('honors parentCommentId, offset, and limit query params', async () => {
        const initial: FeedChannelPostCommentEntity[] = [];
        builder.getMany.mockResolvedValueOnce(initial);
        fakeFind.mockResolvedValue([]); // no replies

        const req = {
            params: { postId: 'p2' },
            query: { parentCommentId: 'pc1', offset: '2', limit: '3' },
        } as any;
        const res = makeRes();

        await getPostComments(req, res);

        expect(builder.andWhere).toHaveBeenCalledWith(
            'comment.parentCommentId = :parentCommentId',
            { parentCommentId: 'pc1' }
        );
        expect(builder.skip).toHaveBeenCalledWith(2);
        expect(builder.take).toHaveBeenCalledWith(3);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(initial);
    });

    it('attaches nested replies recursively', async () => {
        // one top-level comment
        const top = new FeedChannelPostCommentEntity();
        top.id = 'c1';

        const reply = new FeedChannelPostCommentEntity();
        reply.id = 'r1';

        builder.getMany.mockResolvedValueOnce([top]);
        // first fetchReplies('c1') → [reply], then fetchReplies('r1') → []
        // eslint-disable-next-line @typescript-eslint/require-await
        fakeFind.mockImplementation(async (_entity, options) => {
            if (options.where.parentCommentId === 'c1') {
                return [reply];
            }
            return [];
        });

        const req = { params: { postId: 'p3' }, query: {} } as any;
        const res = makeRes();

        await getPostComments(req, res);

        expect(builder.getMany).toHaveBeenCalled();
        // top.children should be set to [reply]
        expect((top as any).children).toEqual([reply]);
        // reply.children should be set to []
        expect((reply as any).children).toEqual([]);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith([top]);
    });

    it('returns 500 on errors', async () => {
        (
            TypeOrmDataSourceSingleton.getInstance as jest.Mock
        ).mockRejectedValueOnce(new Error('boom'));
        const req = { params: { postId: 'p4' }, query: {} } as any;
        const res = makeRes();

        await getPostComments(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith('boom');
    });
});
