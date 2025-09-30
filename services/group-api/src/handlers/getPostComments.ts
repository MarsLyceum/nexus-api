import { Request, Response } from 'express';
import {
    FeedChannelPostCommentEntity,
    GetPostCommentsParams,
    GetPostCommentsQueryParams,
} from 'group-api-client';
import { TypeOrmDataSourceSingleton } from 'third-party-clients';

export const getPostComments = async (
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
        const { parentCommentId } = req.query;

        if (!postId) {
            res.status(400).send('Post ID is required');
            return;
        }

        const dataSource = await TypeOrmDataSourceSingleton.getInstance();

        const commentsQuery = dataSource.manager
            .createQueryBuilder(FeedChannelPostCommentEntity, 'comment')
            .where('comment.postId = :postId', { postId });

        if (parentCommentId) {
            commentsQuery.andWhere(
                'comment.parentCommentId = :parentCommentId',
                { parentCommentId }
            );
        } else {
            commentsQuery.andWhere('comment.parentCommentId IS NULL');
        }

        const initialComments = await commentsQuery
            .orderBy('comment.postedAt', 'DESC')
            .skip(offset)
            .take(limit)
            .getMany();

        // Recursively fetch nested replies
        const fetchReplies = async (_parentCommentId: string) => {
            const replies = await dataSource.manager.find(
                FeedChannelPostCommentEntity,
                // eslint-disable-next-line unicorn/no-array-method-this-argument
                {
                    where: { parentCommentId: _parentCommentId },
                    order: { postedAt: 'ASC' },
                }
            );

            for (const reply of replies) {
                // eslint-disable-next-line no-await-in-loop
                reply.children = await fetchReplies(reply.id); // Recursively fetch nested replies
            }

            return replies;
        };

        // Attach nested replies to each top-level comment
        for (const comment of initialComments) {
            // eslint-disable-next-line no-await-in-loop
            comment.children = await fetchReplies(comment.id);
        }

        res.status(200).json(initialComments);
        // eslint-disable-next-line consistent-return, no-useless-return
        return;
    } catch (error) {
        res.status(500).send((error as Error).message);
    }
};
