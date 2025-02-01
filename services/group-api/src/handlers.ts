import { Request, Response } from 'express';
import {
    GroupEntity,
    GroupMemberEntity,
    GroupChannelEntity,
    CreateGroupPayload,
    GetGroupParams,
    UpdateGroupParams,
    UpdateGroupPayload,
    DeleteGroupParams,
    // Import the GetUserGroupsParams type
    GetUserGroupsParams,
} from 'group-api-client';
import { initializeDataSource } from './database';

/**
 * Handler to create a new group.
 * Expects a payload with:
 *  - createdByUserEmail: string
 *  - name: string
 *
 * This handler creates the group, adds the creator as the sole member with the role "owner",
 * and creates a default "general" text channel.
 */
export const createGroup = async (
    req: Request<unknown, unknown, CreateGroupPayload>,
    res: Response
) => {
    try {
        const { name, createdByUserEmail } = req.body;
        const dataSource = await initializeDataSource();

        // Create a new Group instance.
        const newGroup = dataSource.manager.create(GroupEntity, {
            name,
            createdByUserEmail,
            createdAt: new Date(),
            members: [], // initialize with an empty array; we'll add the owner below
            channels: [], // initialize with an empty array; we'll add the default channel below
            description: undefined,
        });

        // Save the group so it gets a generated ID.
        await dataSource.manager.save(newGroup);

        // Create a GroupMember record for the creator with role "owner".
        const groupMember = dataSource.manager.create(GroupMemberEntity, {
            userEmail: createdByUserEmail,
            role: 'owner',
            joinedAt: new Date(),
            group: newGroup, // establish the relation to the new group
        });

        // Save the group member.
        await dataSource.manager.save(groupMember);

        // Create a default "general" text channel.
        const generalChannel = dataSource.manager.create(GroupChannelEntity, {
            name: 'general',
            type: 'text',
            createdAt: new Date(),
            group: newGroup, // establish the relation to the new group
        });

        // Save the default channel.
        await dataSource.manager.save(generalChannel);

        // Update the group's members and channels arrays.
        newGroup.members = [groupMember];
        newGroup.channels = [generalChannel];

        res.status(201).json(newGroup);
    } catch (error) {
        res.status(500).send((error as Error).message);
    }
};

/**
 * Handler to retrieve a group by its identifier.
 * Expects a route parameter with the group id.
 */
export const getGroup = async (req: Request<GetGroupParams>, res: Response) => {
    try {
        const { id } = req.params;
        if (!id) {
            res.status(400).send('Group id parameter is missing');
            return;
        }
        const dataSource = await initializeDataSource();
        const group = await dataSource.manager.findOne(GroupEntity, {
            where: { id },
            relations: ['members', 'channels'], // include related members and channels
        });

        if (!group) {
            res.status(404).send('Group not found');
        } else {
            res.status(200).json(group);
        }
    } catch (error) {
        res.status(500).send((error as Error).message);
    }
};

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
        const dataSource = await initializeDataSource();

        const group = await dataSource.manager.findOne(GroupEntity, {
            where: { id },
        });
        if (!group) {
            res.status(404).send('Group not found');
            return;
        }

        // Update provided fields from the payload.
        if (payload.name !== undefined) {
            group.name = payload.name;
        }
        if (payload.createdByUserEmail !== undefined) {
            group.createdByUserEmail = payload.createdByUserEmail;
        }
        if (payload.createdAt !== undefined) {
            group.createdAt = new Date(payload.createdAt);
        }
        if (payload.members !== undefined) {
            group.members = payload.members;
        }
        if (payload.channels !== undefined) {
            group.channels = payload.channels;
        }
        if (payload.description !== undefined) {
            group.description = payload.description;
        }

        await dataSource.manager.save(group);
        res.status(200).json(group);
    } catch (error) {
        res.status(500).send((error as Error).message);
    }
};

/**
 * Handler to delete a group by its identifier.
 * Expects a route parameter with the group id.
 */
export const deleteGroup = async (
    req: Request<DeleteGroupParams>,
    res: Response
) => {
    try {
        const { id } = req.params;
        if (!id) {
            res.status(400).send('Group id parameter is missing');
            return;
        }
        const dataSource = await initializeDataSource();
        const group = await dataSource.manager.findOne(GroupEntity, {
            where: { id },
        });

        if (!group) {
            res.status(404).send('Group not found');
            return;
        }

        await dataSource.manager.remove(group);
        res.status(204).send();
    } catch (error) {
        res.status(500).send((error as Error).message);
    }
};

/**
 * Handler to retrieve all groups that a user is a member of.
 * Expects a parameter with:
 *  - email: string
 *
 * This handler queries the GroupMember table (joined with Group) to return a list of groups.
 */
export const getUserGroups = async (
    req: Request<GetUserGroupsParams>,
    res: Response
) => {
    try {
        const { email } = req.params;
        if (!email) {
            res.status(400).send('Email parameter is missing');
            return;
        }
        const dataSource = await initializeDataSource();

        // Use QueryBuilder to join GroupEntity with its members and filter by userEmail.
        const groups = await dataSource.manager
            .createQueryBuilder(GroupEntity, 'group')
            .leftJoinAndSelect('group.members', 'member')
            .leftJoinAndSelect('group.channels', 'channel')
            .where('member.userEmail = :email', { email })
            .getMany();

        res.status(200).json(groups);
    } catch (error) {
        res.status(500).send((error as Error).message);
    }
};
