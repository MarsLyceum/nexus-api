import { Request, Response } from 'express';
import {
    GroupEntity,
    GroupChannelEntity,
    CreateGroupChannelPayload,
} from 'group-api-client';
import { TypeOrmDataSourceSingleton } from 'third-party-clients';

export const createGroupChannel = async (
    req: Request<unknown, unknown, CreateGroupChannelPayload>,
    res: Response
) => {
    try {
        const { name, groupId, type } = req.body;
        const dataSource = await TypeOrmDataSourceSingleton.getInstance();

        const group = await dataSource.manager.findOne(GroupEntity, {
            where: { id: groupId },
        });

        if (!group) {
            res.status(404).send('Group not found');
            return;
        }

        // Create a new channel.
        const channel = dataSource.manager.create(GroupChannelEntity, {
            name,
            type,
            group,
            createdAt: new Date(),
            messages: [],
        });

        // Save the channel.
        await dataSource.manager.save(channel);

        res.status(201).json(channel);
    } catch (error) {
        res.status(500).send((error as Error).message);
    }
};
