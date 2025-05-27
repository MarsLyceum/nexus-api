// tests/getTextChannelMessages.test.ts

/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { TypeOrmDataSourceSingleton } from 'third-party-clients';
import { TextChannelMessageEntity } from 'group-api-client';

import { makeRes } from '../utils';
import { getTextChannelMessages } from '../../src/handlers';

describe('getTextChannelMessages handler', () => {
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
        (TypeOrmDataSourceSingleton.getInstance as jest.Mock).mockResolvedValue(
            fakeDataSource
        );
    });

    it('returns 400 when channelId is missing', async () => {
        const req = { params: {}, query: {} } as any;
        const res = makeRes();

        await getTextChannelMessages(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith(
            'Channel ID parameter is missing'
        );
    });

    it('fetches messages with default offset/limit and returns 200', async () => {
        const messages = [
            { id: 'm1' },
            { id: 'm2' },
        ] as TextChannelMessageEntity[];
        builder.getMany.mockResolvedValueOnce(messages);

        const req = { params: { channelId: 'c1' }, query: {} } as any;
        const res = makeRes();

        await getTextChannelMessages(req, res);

        expect(fakeCreateQueryBuilder).toHaveBeenCalledWith(
            TextChannelMessageEntity,
            'message'
        );
        expect(builder.where).toHaveBeenCalledWith(
            'message.channelId = :channelId',
            { channelId: 'c1' }
        );
        expect(builder.orderBy).toHaveBeenCalledWith(
            'message.postedAt',
            'DESC'
        );
        expect(builder.skip).toHaveBeenCalledWith(0);
        expect(builder.take).toHaveBeenCalledWith(100);
        expect(builder.getMany).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(messages);
    });

    it('honors offset and limit query parameters', async () => {
        builder.getMany.mockResolvedValueOnce([]);

        const req = {
            params: { channelId: 'c1' },
            query: { offset: '10', limit: '5' },
        } as any;
        const res = makeRes();

        await getTextChannelMessages(req, res);

        expect(builder.skip).toHaveBeenCalledWith(10);
        expect(builder.take).toHaveBeenCalledWith(5);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith([]);
    });

    it('handles errors by returning 500', async () => {
        (
            TypeOrmDataSourceSingleton.getInstance as jest.Mock
        ).mockRejectedValueOnce(new Error('oops'));

        const req = { params: { channelId: 'c1' }, query: {} } as any;
        const res = makeRes();

        await getTextChannelMessages(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith('oops');
    });
});
