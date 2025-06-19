/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable unicorn/no-useless-undefined */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { TypeOrmDataSourceSingleton } from 'third-party-clients';
import { GroupEntity, UpdateGroupPayload } from 'group-api-client';

import { makeRes } from '../utils';
import { updateGroup } from '../../src/handlers/updateGroup';

describe('updateGroup handler', () => {
    let fakeFindOne: jest.Mock;
    let fakeSave: jest.Mock;

    beforeEach(() => {
        jest.resetAllMocks();

        fakeFindOne = jest.fn();
        fakeSave = jest.fn().mockResolvedValue(undefined);

        const fakeManager = {
            findOne: fakeFindOne,
            save: fakeSave,
        };
        const fakeDataSource = { manager: fakeManager };
        (TypeOrmDataSourceSingleton.getInstance).mockResolvedValue(
            fakeDataSource
        );
    });

    it('returns 404 if group not found', async () => {
        fakeFindOne.mockResolvedValueOnce(null);

        const req = { params: { id: 'g1' }, body: {} } as any;
        const res = makeRes();

        await updateGroup(req, res);

        expect(fakeFindOne).toHaveBeenCalledWith(GroupEntity, {
            where: { id: 'g1' },
        });
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.send).toHaveBeenCalledWith('Group not found');
    });

    it('updates only the name field and returns 200', async () => {
        const original = {
            id: 'g1',
            name: 'old',
            createdByUserId: 'u1',
        } as GroupEntity;
        fakeFindOne.mockResolvedValueOnce(original);

        const payload: UpdateGroupPayload = {
            name: 'newName',
            createdByUserId: '',
            createdAt: new Date(2025, 5, 27, 8, 0, 0, 0),
            members: [],
            channels: [],
            publicGroup: false,
        };
        const req = { params: { id: 'g1' }, body: payload } as any;
        const res = makeRes();

        await updateGroup(req, res);

        expect(original.name).toBe('newName');
        expect(fakeSave).toHaveBeenCalledWith(original);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(original);
    });

    it('parses createdAt string into Date', async () => {
        const original = {
            id: 'g1',
            createdAt: new Date('2020-01-01T00:00:00Z'),
        } as GroupEntity;
        fakeFindOne.mockResolvedValueOnce(original);

        const iso = '2021-12-12T12:34:56.000Z';
        const payload: UpdateGroupPayload = {
            createdAt: new Date(iso),
            name: '',
            createdByUserId: '',
            members: [],
            channels: [],
            publicGroup: false,
        };
        const req = { params: { id: 'g1' }, body: payload } as any;
        const res = makeRes();

        await updateGroup(req, res);

        expect(original.createdAt.toISOString()).toBe(iso);
        expect(fakeSave).toHaveBeenCalledWith(original);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(original);
    });

    it('updates members, channels, and description', async () => {
        const original = {
            id: 'g1',
            members: [],
            channels: [],
            description: 'oldDesc',
        } as unknown as GroupEntity;
        fakeFindOne.mockResolvedValueOnce(original);

        const newMembers = [{ userId: 'u2' }] as any[];
        const newChannels = [{ id: 'c2' }] as any[];
        const payload: UpdateGroupPayload = {
            members: newMembers,
            channels: newChannels,
            description: 'newDesc',
            name: '',
            createdByUserId: '',
            createdAt: new Date(2025, 5, 27, 8, 0, 0, 0),
            publicGroup: false,
        };
        const req = { params: { id: 'g1' }, body: payload } as any;
        const res = makeRes();

        await updateGroup(req, res);

        expect(original.members).toBe(newMembers);
        expect(original.channels).toBe(newChannels);
        expect(original.description).toBe('newDesc');
        expect(fakeSave).toHaveBeenCalledWith(original);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(original);
    });

    it('handles errors with 500', async () => {
        (
            TypeOrmDataSourceSingleton.getInstance
        ).mockRejectedValueOnce(new Error('fail'));
        const req = { params: { id: 'g1' }, body: {} } as any;
        const res = makeRes();

        await updateGroup(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith('fail');
    });
});
