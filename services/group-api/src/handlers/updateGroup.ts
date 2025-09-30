import { Request, Response } from 'express';
import {
    GroupEntity,
    UpdateGroupParams,
    UpdateGroupPayload,
} from 'group-api-client';
import { TypeOrmDataSourceSingleton } from 'third-party-clients';

/**
 * Handler to update an existing group.
 * Expects:
 *  - A route parameter with the group id.
 *  - A payload (UpdateGroupPayload) containing the new group properties.
 */
export const updateGroup = async (
    req: Request<UpdateGroupParams, unknown, UpdateGroupPayload>,
    res: Response
) => {
    try {
        const { id } = req.params;
        const payload = req.body;
        const dataSource = await TypeOrmDataSourceSingleton.getInstance();

        const group = await dataSource.manager.findOne(GroupEntity, {
            where: { id },
        });
        if (!group) {
            res.status(404).send('Group not found');
            return;
        }

        // Update provided fields.
        if (payload.name !== undefined) group.name = payload.name;
        if (payload.createdByUserId !== undefined)
            group.createdByUserId = payload.createdByUserId;
        if (payload.createdAt !== undefined)
            group.createdAt = new Date(payload.createdAt);
        if (payload.members !== undefined) group.members = payload.members;
        if (payload.channels !== undefined) group.channels = payload.channels;
        if (payload.description !== undefined)
            group.description = payload.description;

        await dataSource.manager.save(group);
        res.status(200).json(group);
    } catch (error) {
        res.status(500).send((error as Error).message);
    }
};
