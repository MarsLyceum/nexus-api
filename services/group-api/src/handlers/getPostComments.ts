// handlers.ts

import { Request, Response } from 'express';
import {
    GroupChannelPostCommentEntity,
    GetPostCommentsParams,
    GetPostCommentsQueryParams,
} from 'group-api-client';
import { initializeDataSource } from '../database';

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
