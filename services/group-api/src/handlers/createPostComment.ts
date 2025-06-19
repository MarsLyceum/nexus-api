import { Request, Response } from 'express';
import {
    FeedChannelPostEntity,
    FeedChannelPostCommentEntity,
    CreateFeedChannelPostCommentPayload,
} from 'group-api-client';
import {
    TypeOrmDataSourceSingleton,
    GoogleCloudStorageSingleton,
} from 'third-party-clients';

export const createPostComment = async (
    req: Request<unknown, unknown, CreateFeedChannelPostCommentPayload>,
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
        const filePaths: string[] = [];

        if (req.files) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            // @ts-expect-error types is wrong
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            const { attachments } = req.files;

            // eslint-disable-next-line no-plusplus, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
            for (const [i, file] of attachments.entries()) {
                // Generate a unique file name for each file
                const filePath = `${Date.now()}_${i}`;

                // Upload the file buffer to Supabase Storage.

                // eslint-disable-next-line no-await-in-loop
                await GoogleCloudStorageSingleton.getInstance()
                    .bucket('nexus-comment-attachments')
                    .file(filePath)
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                    .save(file.buffer, {
                        metadata: { contentType: file.mimetype },
                    });

                // Store the file path for further use.
                filePaths.push(filePath);
            }
        }

        // Start a transaction to ensure consistency
        const newComment = await dataSource.manager.transaction(
            async (manager) => {
                // Ensure the post exists
                const post = await manager.findOne(FeedChannelPostEntity, {
                    where: { id: postId },
                });

                if (!post) {
                    throw new Error('Post not found');
                }

                // If this is a reply, check that the parent comment exists
                let parentComment: FeedChannelPostCommentEntity | null = null;
                if (parentCommentId) {
                    parentComment = await manager.findOne(
                        FeedChannelPostCommentEntity,
                        { where: { id: parentCommentId } }
                    );

                    if (!parentComment) {
                        throw new Error('Parent comment not found');
                    }
                }

                // Create the new comment
                const comment = manager.create(FeedChannelPostCommentEntity, {
                    content,
                    postedByUserId,
                    postedAt: new Date(),
                    attachmentFilePaths: filePaths,
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
