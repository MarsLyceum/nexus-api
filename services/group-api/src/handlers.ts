// handlers.ts

import { Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import { In } from 'typeorm';
import {
    GroupEntity,
    GroupMemberEntity,
    GroupChannelEntity,
    GroupChannelMessageMessageEntity,
    GroupChannelPostEntity,
    CreateGroupPayload,
    CreateGroupChannelMessagePayload,
    GroupChannelMessageEntity,
    GetChannelMessagesParams,
    GetChannelMessagesQueryParams,
    GetGroupParams,
    UpdateGroupParams,
    UpdateGroupPayload,
    DeleteGroupParams,
    GetUserGroupsParams,
    CreateGroupChannelPayload,
    GroupChannelPostCommentEntity,
    CreateGroupChannelPostCommentPayload,
    GetPostCommentsParams,
    GetPostCommentsQueryParams,
} from 'group-api-client';
import { initializeDataSource } from './database';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;
const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

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
        const dataSource = await initializeDataSource();
        let avatarFilePath: string | undefined = undefined;

        if (req.file) {
            // Generate a unique file name (you can adjust the naming scheme)
            avatarFilePath = `${Date.now()}`;

            // Upload the file buffer to Supabase Storage.
            const { error } = await supabaseClient.storage
                .from('group-avatars')
                .upload(avatarFilePath, req.file.buffer, {
                    contentType: req.file.mimetype,
                    upsert: false,
                });

            if (error) {
                console.error(
                    'Error uploading file to Supabase:',
                    error.message
                );
                throw new Error('Failed to upload group avatar.');
            }
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
                console.log(group);

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
                });
                await manager.save(generalChannel);

                // Create a default "feed" feed channel.
                const feedChannel = manager.create(GroupChannelEntity, {
                    name: 'feed',
                    type: 'feed',
                    createdAt: new Date(),
                    group,
                    messages: [],
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

export const createGroupChannel = async (
    req: Request<unknown, unknown, CreateGroupChannelPayload>,
    res: Response
) => {
    try {
        const { name, groupId, type } = req.body;
        const dataSource = await initializeDataSource();

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
            createdAt: new Date(),
            group: group,
            messages: [],
        });

        // Save the channel.
        await dataSource.manager.save(channel);

        res.status(201).json(channel);
    } catch (error) {
        res.status(500).send((error as Error).message);
    }
};

/**
 * Handler to create a channel message.
 * Supports two types:
 *   - Regular message (messageType: 'message')
 *   - Post message (messageType: 'post') with additional post fields.
 * All related operations are wrapped in a transaction.
 */
export const createGroupChannelMessage = async (
    req: Request<unknown, unknown, CreateGroupChannelMessagePayload>,
    res: Response
) => {
    try {
        const dataSource = await initializeDataSource();

        // Wrap the operations in a transaction.
        const newMessage = await dataSource.manager.transaction(
            async (manager) => {
                // Retrieve the channel within the transaction.
                const groupChannel = await manager.findOne(GroupChannelEntity, {
                    where: { id: req.body.channelId },
                    relations: ['group', 'messages'],
                });

                if (!groupChannel) {
                    // Throw an error to abort the transaction.
                    throw new Error('Invalid channel id');
                }

                let message:
                    | GroupChannelMessageMessageEntity
                    | GroupChannelPostEntity;

                // Check the payload type discriminator.
                if (req.body.messageType === 'post') {
                    const {
                        content,
                        channelId,
                        postedByUserId,
                        title,
                        flair,
                        domain,
                        thumbnail,
                    } = req.body as Extract<
                        CreateGroupChannelMessagePayload,
                        { messageType: 'post' }
                    >;

                    message = manager.create(GroupChannelPostEntity, {
                        content,
                        channelId,
                        postedByUserId,
                        postedAt: new Date(),
                        edited: false,
                        channel: groupChannel,
                        title,
                        flair,
                        domain,
                        thumbnail,
                        upvotes: 0,
                        commentsCount: 0,
                        shareCount: 0,
                    });
                } else {
                    const { content, channelId, postedByUserId } =
                        req.body as Extract<
                            CreateGroupChannelMessagePayload,
                            { messageType: 'message' }
                        >;

                    message = manager.create(GroupChannelMessageMessageEntity, {
                        content,
                        channelId,
                        postedByUserId,
                        postedAt: new Date(),
                        edited: false,
                        channel: groupChannel,
                    });
                }

                // Save the new message.
                await manager.save(message);

                // Optionally, update the channel's messages array.
                groupChannel.messages = [...groupChannel.messages, message];
                await manager.save(groupChannel);

                return message;
            }
        );

        res.status(201).json(newMessage);
    } catch (error) {
        // If the error message is 'Invalid channel id', return 404.
        if ((error as Error).message === 'Invalid channel id') {
            res.status(404).json({ error: 'Invalid channel id' });
        } else {
            res.status(500).send((error as Error).message);
        }
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
            relations: ['members', 'channels'],
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

        const dataSource = await initializeDataSource();

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

        // After the database transaction completes, delete the avatar from Supabase Storage if it exists.
        if (group.avatarFilePath) {
            const { error: storageError } = await supabaseClient.storage
                .from('group-avatars')
                .remove([group.avatarFilePath]);
            if (storageError) {
                console.error(
                    'Error deleting group avatar from Supabase Storage:',
                    storageError.message
                );
                // Optionally, you could return a 500 error here or simply log the error.
            }
        }

        res.status(204).send();
    } catch (error) {
        console.error('Error deleting group:', (error as Error).message);
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

        // Fetch messages for the channel.
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

export const createGroupChannelPostComment = async (
    req: Request<unknown, unknown, CreateGroupChannelPostCommentPayload>,
    res: Response
) => {
    try {
        const {
            content,
            postedByUserId,
            postId,
            parentCommentId = null,
            upvotes = 0,
        } = req.body;

        const dataSource = await initializeDataSource();

        // Start a transaction to ensure consistency
        const newComment = await dataSource.manager.transaction(
            async (manager) => {
                // Ensure the post exists
                const post = await manager.findOne(GroupChannelPostEntity, {
                    where: { id: postId },
                });

                if (!post) {
                    throw new Error('Post not found');
                }

                // If this is a reply, check that the parent comment exists
                let parentComment: GroupChannelPostCommentEntity | null = null;
                if (parentCommentId) {
                    parentComment = await manager.findOne(
                        GroupChannelPostCommentEntity,
                        { where: { id: parentCommentId } }
                    );

                    if (!parentComment) {
                        throw new Error('Parent comment not found');
                    }
                }

                // Create the new comment
                const comment = manager.create(GroupChannelPostCommentEntity, {
                    content,
                    postedByUserId,
                    postedAt: new Date(),
                    edited: false,
                    post,
                    postId,
                    parentComment,
                    parentCommentId,
                    upvotes,
                    children: [],
                });

                await manager.save(comment);

                return comment;
            }
        );

        res.status(201).json(newComment);
    } catch (error) {
        if ((error as Error).message === 'Post not found') {
            res.status(404).json({ error: 'Post not found' });
        } else if ((error as Error).message === 'Parent comment not found') {
            res.status(404).json({ error: 'Parent comment not found' });
        } else {
            res.status(500).send((error as Error).message);
        }
    }
};

export const getGroupChannelPostComments = async (
    req: Request<
        GetPostCommentsParams,
        unknown,
        unknown,
        GetPostCommentsQueryParams
    >,
    res: Response
): Promise<void> => {
    try {
        const { postId } = req.params;
        const offset = Number.parseInt(req.query.offset || '0', 10);
        const limit = Number.parseInt(req.query.limit || '50', 10);

        if (!postId) {
            res.status(400).send('Post ID is required');
            return;
        }

        const dataSource = await initializeDataSource();

        // Fetch paginated top-level comments
        const topLevelComments = await dataSource.manager
            .createQueryBuilder(GroupChannelPostCommentEntity, 'comment')
            .where('comment.postId = :postId', { postId })
            .andWhere('comment.parentCommentId IS NULL') // Fetch only top-level comments
            .orderBy('comment.postedAt', 'DESC')
            .skip(offset)
            .take(limit)
            .getMany();

        // Recursively fetch nested replies
        const fetchReplies = async (parentCommentId: string) => {
            const replies = await dataSource.manager.find(
                GroupChannelPostCommentEntity,
                {
                    where: { parentCommentId },
                    order: { postedAt: 'ASC' },
                }
            );

            for (const reply of replies) {
                reply.children = await fetchReplies(reply.id); // Recursively fetch nested replies
            }

            return replies;
        };

        // Attach nested replies to each top-level comment
        for (const comment of topLevelComments) {
            comment.children = await fetchReplies(comment.id);
        }

        res.status(200).json(topLevelComments);
        // eslint-disable-next-line consistent-return, no-useless-return
        return;
    } catch (error) {
        res.status(500).send((error as Error).message);
    }
};
