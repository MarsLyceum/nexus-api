/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable unicorn/no-useless-undefined */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { TypeOrmDataSourceSingleton } from 'third-party-clients';
import { FeedChannelPostEntity } from 'group-api-client';

import { makeRes } from '../utils';
import { getFeedChannelPosts } from '../../src/handlers/getFeedChannelPosts';

describe('getFeedChannelPosts handler', () => {
    let builder: {
        where: jest.Mock;
        orderBy: jest.Mock;
        skip: jest.Mock;
        take: jest.Mock;
        getMany: jest.Mock;
    };
    let fakeCreateQueryBuilder: jest.Mock;

    beforeEach(() => {
        jest.resetAllMocks();

        builder = {
            where: jest.fn().mockReturnThis(),
            orderBy: jest.fn().mockReturnThis(),
            skip: jest.fn().mockReturnThis(),
            take: jest.fn().mockReturnThis(),
            getMany: jest.fn(),
        };

        fakeCreateQueryBuilder = jest.fn().mockReturnValue(builder);

        const fakeDataSource = {
            manager: { createQueryBuilder: fakeCreateQueryBuilder },
        };
        (TypeOrmDataSourceSingleton.getInstance).mockResolvedValue(
            fakeDataSource
        );
    });

    it('returns 400 when channelId is missing', async () => {
        const req = { params: {}, query: {} } as any;
        const res = makeRes();

        await getFeedChannelPosts(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith(
            'Channel ID parameter is missing'
        );
    });

    it('fetches posts with default offset/limit and returns 200', async () => {
        const posts = [{ id: 'p1' }, { id: 'p2' }] as FeedChannelPostEntity[];
        builder.getMany.mockResolvedValueOnce(posts);

        const req = { params: { channelId: 'c1' }, query: {} } as any;
        const res = makeRes();

        await getFeedChannelPosts(req, res);

        expect(fakeCreateQueryBuilder).toHaveBeenCalledWith(
            FeedChannelPostEntity,
            'post'
        );
        expect(builder.where).toHaveBeenCalledWith(
            'post.channelId = :channelId',
            { channelId: 'c1' }
        );
        expect(builder.orderBy).toHaveBeenCalledWith('post.postedAt', 'DESC');
        expect(builder.skip).toHaveBeenCalledWith(0);
        expect(builder.take).toHaveBeenCalledWith(100);
        expect(builder.getMany).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(posts);
    });

    it('honors offset and limit query parameters', async () => {
        builder.getMany.mockResolvedValueOnce([]);

        const req = {
            params: { channelId: 'c1' },
            query: { offset: '5', limit: '2' },
        } as any;
        const res = makeRes();

        await getFeedChannelPosts(req, res);

        expect(builder.skip).toHaveBeenCalledWith(5);
        expect(builder.take).toHaveBeenCalledWith(2);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith([]);
    });

    it('handles errors by returning 500', async () => {
        (
            TypeOrmDataSourceSingleton.getInstance
        ).mockRejectedValueOnce(new Error('fail'));

        const req = { params: { channelId: 'c1' }, query: {} } as any;
        const res = makeRes();

        await getFeedChannelPosts(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith('fail');
    });
});
