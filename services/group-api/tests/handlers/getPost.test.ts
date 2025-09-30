/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable unicorn/no-useless-undefined */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/unbound-method */

import {
    RedisClientSingleton,
    TypeOrmDataSourceSingleton,
} from 'third-party-clients';
import { FeedChannelPostEntity } from 'group-api-client';

import { makeRes } from '../utils';
import { getPost } from '../../src/handlers/getPost';

describe('getPost handler', () => {
    let fakeGet: jest.Mock;
    let fakeSet: jest.Mock;
    let fakeFindOne: jest.Mock;

    beforeEach(() => {
        jest.resetAllMocks();

        fakeGet = jest.fn();
        fakeSet = jest.fn().mockResolvedValue(undefined);
        (RedisClientSingleton.getInstance).mockReturnValue({
            get: fakeGet,
            set: fakeSet,
        });

        fakeFindOne = jest.fn();
        const fakeDataSource = { manager: { findOne: fakeFindOne } };
        (TypeOrmDataSourceSingleton.getInstance).mockResolvedValue(
            fakeDataSource
        );
    });

    it('returns 400 when id is missing', async () => {
        const req = { params: {} } as any;
        const res = makeRes();

        await getPost(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith('Group id parameter is missing');
    });

    it('returns 200 with cached post without calling DB', async () => {
        const cached = {
            id: 'post1',
            content: 'hello',
        } as FeedChannelPostEntity;
        fakeGet.mockResolvedValueOnce(cached);

        const req = { params: { id: 'post1' } } as any;
        const res = makeRes();

        await getPost(req, res);

        expect(fakeGet).toHaveBeenCalledWith('post:post1');
        expect(TypeOrmDataSourceSingleton.getInstance).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(cached);
        expect(fakeSet).not.toHaveBeenCalled();
    });

    it('fetches from DB and caches then returns 200', async () => {
        fakeGet.mockResolvedValueOnce(null);
        const post = { id: 'post2', content: 'world' } as FeedChannelPostEntity;
        fakeFindOne.mockResolvedValueOnce(post);

        const req = { params: { id: 'post2' } } as any;
        const res = makeRes();

        await getPost(req, res);

        expect(fakeGet).toHaveBeenCalledWith('post:post2');
        expect(TypeOrmDataSourceSingleton.getInstance).toHaveBeenCalled();
        expect(fakeFindOne).toHaveBeenCalledWith(FeedChannelPostEntity, {
            where: { id: 'post2' },
        });
        expect(fakeSet).toHaveBeenCalledWith('post:post2', post);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(post);
    });

    it('returns 404 when not cached and not found in DB', async () => {
        fakeGet.mockResolvedValueOnce(null);
        fakeFindOne.mockResolvedValueOnce(null);

        const req = { params: { id: 'missing' } } as any;
        const res = makeRes();

        await getPost(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.send).toHaveBeenCalledWith('Post not found');
    });

    it('returns 500 on error', async () => {
        fakeGet.mockRejectedValueOnce(new Error('redis failure'));

        const req = { params: { id: 'post1' } } as any;
        const res = makeRes();

        await getPost(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith('redis failure');
    });
});
