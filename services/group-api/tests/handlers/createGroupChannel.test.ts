/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable unicorn/no-useless-undefined */

import { TypeOrmDataSourceSingleton } from 'third-party-clients';
import {
    GroupEntity,
    GroupChannelEntity,
    CreateGroupChannelPayload,
} from 'group-api-client';

import { createGroupChannel } from '../../src/handlers';
import { makeReq, makeRes } from '../utils';

describe('createGroupChannel handler', () => {
    let fakeManager: {
        findOne: jest.Mock;
        create: jest.Mock;
        save: jest.Mock;
    };

    beforeEach(() => {
        jest.resetAllMocks();

        fakeManager = {
            findOne: jest.fn(),
            create: jest.fn((_, data) => data),
            save: jest.fn().mockResolvedValue(undefined),
        };

        const fakeDataSource = {
            manager: fakeManager,
        };

        (TypeOrmDataSourceSingleton.getInstance).mockResolvedValue(
            fakeDataSource
        );
    });

    it('creates a channel when the group exists', async () => {
        const existingGroup = { id: 'g1', name: 'Test' } as GroupEntity;
        fakeManager.findOne.mockResolvedValueOnce(existingGroup);

        const payload: CreateGroupChannelPayload = {
            name: 'New Channel',
            groupId: 'g1',
            type: 'text',
        };
        const req = makeReq(payload);
        const res = makeRes();

        await createGroupChannel(req, res);

        expect(fakeManager.create).toHaveBeenCalledWith(
            GroupChannelEntity,
            expect.objectContaining({
                name: 'New Channel',
                type: 'text',
                group: existingGroup,
                messages: [],
            })
        );

        const createdChannel = fakeManager.create.mock.results[0].value;
        expect(fakeManager.save).toHaveBeenCalledWith(createdChannel);

        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ name: 'New Channel' })
        );
    });

    it('returns 404 when the group does not exist', async () => {
        fakeManager.findOne.mockResolvedValueOnce(null);

        const req = makeReq({
            name: 'No Group',
            groupId: 'missing',
            type: 'voice',
        });
        const res = makeRes();

        await createGroupChannel(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.send).toHaveBeenCalledWith('Group not found');
    });

    it('handles unexpected errors with 500', async () => {
        (
            TypeOrmDataSourceSingleton.getInstance
        ).mockRejectedValueOnce(new Error('db down'));

        const req = makeReq({
            name: 'ErrorCase',
            groupId: 'g1',
            type: 'feed',
        });
        const res = makeRes();

        await createGroupChannel(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith('db down');
    });
});
