/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable unicorn/no-useless-undefined */
/* eslint-disable @typescript-eslint/no-explicit-any */

import {
    TypeOrmDataSourceSingleton,
    RedisClientSingleton,
} from 'third-party-clients';
import { GroupEntity } from 'group-api-client';
import { REDIS_EXPIRATION_SECONDS } from '../../src/constants';

import { makeRes } from '../utils';
import { getUserGroups } from '../../src/handlers';

describe('getUserGroups handler', () => {
    let builder: {
        innerJoinAndSelect: jest.Mock;
        leftJoinAndSelect: jest.Mock;
        where: jest.Mock;
        orderBy: jest.Mock;
        getMany: jest.Mock;
    };
    let fakeCreateQueryBuilder: jest.Mock;
    let fakeSet: jest.Mock;

    beforeEach(() => {
        jest.resetAllMocks();

        builder = {
            innerJoinAndSelect: jest.fn().mockReturnThis(),
            leftJoinAndSelect: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            orderBy: jest.fn().mockReturnThis(),
            getMany: jest.fn(),
        };
        fakeCreateQueryBuilder = jest.fn().mockReturnValue(builder);

        const fakeDataSource = {
            manager: { createQueryBuilder: fakeCreateQueryBuilder },
        };
        (TypeOrmDataSourceSingleton.getInstance).mockResolvedValue(
            fakeDataSource
        );

        fakeSet = jest.fn().mockResolvedValue(undefined);
        (RedisClientSingleton.getInstance).mockReturnValue({
            set: fakeSet,
        });
    });

    it('returns 400 when userId is missing', async () => {
        const req = { params: {} } as any;
        const res = makeRes();

        await getUserGroups(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith('User ID parameter is missing');
    });

    it('fetches groups, caches them, and returns 200', async () => {
        const groups = [{ id: 'g1' }] as GroupEntity[];
        builder.getMany.mockResolvedValueOnce(groups);

        const req = { params: { userId: 'u1' } } as any;
        const res = makeRes();

        await getUserGroups(req, res);

        expect(fakeCreateQueryBuilder).toHaveBeenCalledWith(
            GroupEntity,
            'group'
        );
        expect(builder.innerJoinAndSelect).toHaveBeenCalledWith(
            'group.members',
            'member'
        );
        expect(builder.leftJoinAndSelect).toHaveBeenCalledWith(
            'group.channels',
            'channel'
        );
        expect(builder.where).toHaveBeenCalledWith('member.userId = :userId', {
            userId: 'u1',
        });
        expect(builder.orderBy).toHaveBeenCalledWith(
            'channel.orderIndex',
            'ASC'
        );
        expect(builder.getMany).toHaveBeenCalled();

        const expectedKey = 'user_groups:u1';
        expect(fakeSet).toHaveBeenCalledWith(expectedKey, groups, {
            ex: REDIS_EXPIRATION_SECONDS,
        });

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(groups);
    });

    it('handles errors by returning 500', async () => {
        (
            TypeOrmDataSourceSingleton.getInstance
        ).mockRejectedValueOnce(new Error('fail'));

        const req = { params: { userId: 'u1' } } as any;
        const res = makeRes();

        await getUserGroups(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith('fail');
    });
});
