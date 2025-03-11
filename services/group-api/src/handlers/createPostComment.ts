import { Request, Response } from 'express';
import {
    GroupChannelPostEntity,
    GroupChannelPostCommentEntity,
    CreateGroupChannelPostCommentPayload,
} from 'group-api-client';
import { TypeOrmDataSourceSingleton } from 'third-party-clients';

export const createPostComment = async (
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
            hasChildren,
        } = req.body;

        const dataSource = await TypeOrmDataSourceSingleton.getInstance();

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

                console.log('about to save comment to db:', {
                    content,
                    postedByUserId,
                    postedAt: new Date(),
                    edited: false,
                    post,
                    postId,
                    parentComment,
                    parentCommentId,
                    upvotes,
                    hasChildren,
                    children: [],
                });

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
                    hasChildren,
                    children: [],
                });

                await manager.save(comment);

                if (parentComment) {
                    parentComment.hasChildren = true;
                    await manager.save(parentComment);
                }

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
