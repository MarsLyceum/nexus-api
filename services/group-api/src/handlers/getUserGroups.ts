// handlers.ts

import { Request, Response } from 'express';
import { GroupEntity, GetUserGroupsParams } from 'group-api-client';
import { initializeDataSource } from '../database';

export const getUserGroups = async (
    req: Request<GetUserGroupsParams>,
    res: Response
) => {
    try {
        const { userId } = req.params;
        if (!userId) {
            res.status(400).send('User ID parameter is missing');
            return;
        }
        const dataSource = await initializeDataSource();

        const groups = await dataSource.manager
            .createQueryBuilder(GroupEntity, 'group')
            .leftJoinAndSelect('group.members', 'member')
            .leftJoinAndSelect('group.channels', 'channel')
            .leftJoinAndSelect('channel.messages', 'message')
            .where('member.userId = :userId', { userId })
            .getMany();

        res.status(200).json(groups);
    } catch (error) {
        res.status(500).send((error as Error).message);
    }
};
