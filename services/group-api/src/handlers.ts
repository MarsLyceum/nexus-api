import { Request, Response } from 'express';
import {
    GroupEntity,
    GroupMemberEntity,
    GroupChannelEntity,
    GroupChannelMessageEntity,
    CreateGroupPayload,
    CreateGroupChannelMessagePayload,
    GetChannelMessagesParams,
    GetChannelMessagesQueryParams,
    GetGroupParams,
    UpdateGroupParams,
    UpdateGroupPayload,
    DeleteGroupParams,
    GetUserGroupsParams,
    CreateGroupChannelPayload,
} from 'group-api-client';
import { initializeDataSource } from './database';

/**
 * Handler to create a new group.
 * Expects a payload with:
 *  - createdByUserId: string
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
        const { name, createdByUserId } = req.body;
        const dataSource = await initializeDataSource();

        // Create a new Group instance.
        const newGroup = dataSource.manager.create(GroupEntity, {
            name,
            createdByUserId,
            createdAt: new Date(),
            members: [], // initialize with an empty array; we'll add the owner below
            channels: [], // initialize with an empty array; we'll add the default channel below
            description: undefined,
        });

        // Save the group so it gets a generated ID.
        await dataSource.manager.save(newGroup);

        // Create a GroupMember record for the creator with role "owner".
        const groupMember = dataSource.manager.create(GroupMemberEntity, {
            userId: createdByUserId,
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
            messages: [],
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

export const createGroupChannel = async (
    req: Request<unknown, unknown, CreateGroupChannelPayload>,
    res: Response
) => {
    try {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const { name, groupId } = req.body;
        const dataSource = await initializeDataSource();

        const group = await dataSource.manager.findOne(GroupEntity, {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            where: { id: groupId },
        });

        if (!group) {
            res.status(404).send('Group not found');
        }

        // Create a default "general" text channel.
        const channel = dataSource.manager.create(GroupChannelEntity, {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            name,
            type: 'text',
            createdAt: new Date(),
            group: group!,
            messages: [],
        });

        // Save the default channel.
        await dataSource.manager.save(channel);

        res.status(201).json(channel);
    } catch (error) {
        res.status(500).send((error as Error).message);
    }
};

export const createGroupChannelMessage = async (
    req: Request<unknown, unknown, CreateGroupChannelMessagePayload>,
    res: Response
) => {
    try {
        const { channelId, content, postedByUserId } = req.body;
        const dataSource = await initializeDataSource();

        const groupChannel = await dataSource.manager.findOne(
            GroupChannelEntity,
            {
                where: { id: channelId },
                relations: ['group', 'messages'],
            }
        );

        if (!groupChannel) {
            res.status(404).json({ error: 'Invalid channel id' });
            return;
        }

        // Create a new Group instance.
        const newGroupChannelMessage = dataSource.manager.create(
            GroupChannelMessageEntity,
            {
                content,
                channelId,
                postedByUserId,
                postedAt: new Date(),
                edited: false,
                channel: groupChannel,
            }
        );

        // Save the group so it gets a generated ID.
        await dataSource.manager.save(newGroupChannelMessage);

        groupChannel.messages = [
            ...groupChannel.messages,
            newGroupChannelMessage,
        ];

        await dataSource.manager.save(groupChannel);

        res.status(201).json(newGroupChannelMessage);
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
        if (payload.createdByUserId !== undefined) {
            group.createdByUserId = payload.createdByUserId;
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

        // Use QueryBuilder to join GroupEntity with its members and filter by userEmail.
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

export const getChannelMessages = async (
    req: Request<
        GetChannelMessagesParams,
        unknown,
        unknown,
        GetChannelMessagesQueryParams
    >,
    res: Response
) => {
    try {
        const { channelId } = req.params;
        const { offset: offsetQuery } = req.query;
        const offset = Number.parseInt(offsetQuery || '0', 10);
        const limit = 100;

        if (!channelId) {
            res.status(400).send('Channel ID parameter is missing');
            return;
        }
        const dataSource = await initializeDataSource();

        // Use the repository to fetch messages for the given channel.
        // Order by postedAt descending so that the most recent messages are returned first.
        const messages = await dataSource.manager
            .createQueryBuilder(GroupChannelMessageEntity, 'message')
            .where('message.channelId = :channelId', { channelId })
            .orderBy('message.postedAt', 'DESC')
            .skip(offset)
            .take(limit)
            .getMany();

        res.status(200).json(messages);
    } catch (error) {
        res.status(500).send((error as Error).message);
    }
};
