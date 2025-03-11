// handlers.ts

import { Request, Response } from 'express';
import {
    GroupEntity,
    GroupMemberEntity,
    GroupChannelEntity,
    CreateGroupPayload,
} from 'group-api-client';
import {
    GoogleCloudStorageSingleton,
    TypeOrmDataSourceSingleton,
} from 'third-party-clients';

/**
 * Handler to create a new group.
 * Expects a payload with:
 *  - createdByUserId: string
 *  - name: string
 *
 * This handler creates the group, adds the creator as the sole member with the role "owner",
 * and creates a default "general" text channel.
 * All operations are wrapped in a transaction.
 */
export const createGroup = async (
    req: Request<unknown, unknown, CreateGroupPayload>,
    res: Response
) => {
    try {
        const { name, createdByUserId, publicGroup } = req.body;
        const dataSource = await TypeOrmDataSourceSingleton.getInstance();
        let avatarFilePath: string | undefined;

        if (req.file) {
            // Generate a unique file name (you can adjust the naming scheme)
            avatarFilePath = `${Date.now()}`;

            // Upload the file buffer to Cloud Storage.
            await GoogleCloudStorageSingleton.getInstance()
                .bucket('group-avatars')
                .file(avatarFilePath)
                .save(req.file.buffer, {
                    metadata: { contentType: req.file.mimetype },
                });
        }

        // Wrap multiple writes in a transaction.
        const newGroup = await dataSource.manager.transaction(
            async (manager) => {
                // Create a new Group instance.
                const group = manager.create(GroupEntity, {
                    name,
                    createdByUserId,
                    publicGroup,
                    createdAt: new Date(),
                    members: [], // will add the owner below
                    channels: [], // will add the default channel below
                    description: undefined,
                    avatarFilePath,
                });
                await manager.save(group);

                // Create a GroupMember record for the creator with role "owner".
                const groupMember = manager.create(GroupMemberEntity, {
                    userId: createdByUserId,
                    role: 'owner',
                    joinedAt: new Date(),
                    group,
                });
                await manager.save(groupMember);

                // Create a default "general" text channel.
                const generalChannel = manager.create(GroupChannelEntity, {
                    name: 'general',
                    type: 'text',
                    createdAt: new Date(),
                    group,
                    messages: [],
                    orderIndex: 0,
                });
                await manager.save(generalChannel);

                // Create a default "feed" feed channel.
                const feedChannel = manager.create(GroupChannelEntity, {
                    name: 'feed',
                    type: 'feed',
                    createdAt: new Date(),
                    group,
                    messages: [],
                    orderIndex: 1,
                });
                await manager.save(feedChannel);

                return group;
            }
        );

        res.status(201).json(newGroup);
    } catch (error) {
        res.status(500).send((error as Error).message);
    }
};
