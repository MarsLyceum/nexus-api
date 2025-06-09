/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable unicorn/no-useless-undefined */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/unbound-method */

import {
    RedisClientSingleton,
    TypeOrmDataSourceSingleton,
} from 'third-party-clients';
import { GroupEntity } from 'group-api-client';

import { makeRes } from '../utils';
import { getGroup } from '../../src/handlers/getGroup';

describe('getGroup handler', () => {
    let fakeGet: jest.Mock;
    let fakeSet: jest.Mock;
    let fakeManager: { findOne: jest.Mock };

    beforeEach(() => {
        jest.resetAllMocks();

        fakeGet = jest.fn();
        fakeSet = jest.fn().mockResolvedValue(undefined);
        (RedisClientSingleton.getInstance).mockReturnValue({
            get: fakeGet,
            set: fakeSet,
        });

        fakeManager = { findOne: jest.fn() };
        const fakeDataSource = { manager: fakeManager };
        (TypeOrmDataSourceSingleton.getInstance).mockResolvedValue(
            fakeDataSource
        );
    });

    it('returns 400 when id is missing', async () => {
        const req = { params: {} } as any;
        const res = makeRes();

        await getGroup(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith('Group id parameter is missing');
    });

    it('returns 200 with cached group', async () => {
        const cached = { id: 'g1', name: 'Cached' } as GroupEntity;
        fakeGet.mockResolvedValueOnce(cached);

        const req = { params: { id: 'g1' } } as any;
        const res = makeRes();

        await getGroup(req, res);

        expect(fakeGet).toHaveBeenCalledWith('group:g1');
        expect(TypeOrmDataSourceSingleton.getInstance).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(cached);
    });

    it('fetches from DB and sets cache when not cached', async () => {
        fakeGet.mockResolvedValueOnce(null);
        const group = { id: 'g2', name: 'FromDB' } as GroupEntity;
        fakeManager.findOne.mockResolvedValueOnce(group);

        const req = { params: { id: 'g2' } } as any;
        const res = makeRes();

        await getGroup(req, res);

        expect(fakeGet).toHaveBeenCalledWith('group:g2');
        expect(TypeOrmDataSourceSingleton.getInstance).toHaveBeenCalled();
        expect(fakeManager.findOne).toHaveBeenCalledWith(GroupEntity, {
            where: { id: 'g2' },
            relations: ['members', 'channels'],
        });
        expect(fakeSet).toHaveBeenCalledWith('group:g2', group);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(group);
    });

    it('returns 404 when not found in cache or DB', async () => {
        fakeGet.mockResolvedValueOnce(null);
        fakeManager.findOne.mockResolvedValueOnce(null);

        const req = { params: { id: 'missing' } } as any;
        const res = makeRes();

        await getGroup(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.send).toHaveBeenCalledWith('Group not found');
    });

    it('handles errors with 500', async () => {
        (RedisClientSingleton.getInstance).mockImplementation(
            () => {
                throw new Error('redis fail');
            }
        );

        const req = { params: { id: 'g3' } } as any;
        const res = makeRes();

        await getGroup(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith('redis fail');
    });
});
