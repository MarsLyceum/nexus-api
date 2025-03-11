// handlers.ts

import { Request, Response } from 'express';
import { In } from 'typeorm';
import {
    GroupEntity,
    GroupMemberEntity,
    GroupChannelEntity,
    GroupChannelMessageMessageEntity,
    GroupChannelPostEntity,
    DeleteGroupParams,
    GroupChannelPostCommentEntity,
} from 'group-api-client';
import {
    GoogleCloudStorageSingleton,
    TypeOrmDataSourceSingleton,
} from 'third-party-clients';

/**
 * Handler to delete a group by its identifier.
 * Expects a route parameter with the group id.
 * Also deletes the group avatar from Supabase Storage if it exists.
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

        const dataSource = await TypeOrmDataSourceSingleton.getInstance();

        // Retrieve the group along with its channels.
        // (Adjust relations as needed; here we assume that channels are loaded.)
        const group = await dataSource.manager.findOne(GroupEntity, {
            where: { id },
            relations: ['channels'],
        });

        if (!group) {
            res.status(404).send('Group not found');
            return;
        }

        // Run all deletions in a transaction.
        await dataSource.manager.transaction(async (manager) => {
            // 1. Remove associated channels and their messages.
            const channels = await manager.find(GroupChannelEntity, {
                where: { group: { id: group.id } },
            });
            const channelIds = channels.map((channel) => channel.id);

            if (channelIds.length > 0) {
                // a. Find all "post" messages in these channels.
                const posts = await manager.find(GroupChannelPostEntity, {
                    where: { channelId: In(channelIds) },
                });
                const postIds = posts.map((post) => post.id);

                // b. Delete all comments for these posts.
                if (postIds.length > 0) {
                    await manager.delete(GroupChannelPostCommentEntity, {
                        postId: In(postIds),
                    });
                }

                // c. Delete all post messages in these channels.
                await manager.delete(GroupChannelPostEntity, {
                    channelId: In(channelIds),
                });

                // d. Delete all regular channel messages.
                await manager.delete(GroupChannelMessageMessageEntity, {
                    channelId: In(channelIds),
                });

                // e. Delete the channels themselves.
                await manager.delete(GroupChannelEntity, {
                    id: In(channelIds),
                });
            }

            // 2. Delete all group members.
            await manager.delete(GroupMemberEntity, {
                group: { id: group.id },
            });

            // 3. Finally, delete the group.
            await manager.delete(GroupEntity, { id: group.id });
        });

        // After the database transaction completes, delete the avatar from Cloud Storage if it exists.
        if (group.avatarFilePath) {
            await GoogleCloudStorageSingleton.getInstance()
                .bucket('group-avatars')
                .file(group.avatarFilePath)
                .delete();
        }

        res.status(204).send();
    } catch (error) {
        console.error('Error deleting group:', (error as Error).message);
        res.status(500).send((error as Error).message);
    }
};
