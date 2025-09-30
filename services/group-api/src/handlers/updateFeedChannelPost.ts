import { Request, Response } from 'express';
import {
    FeedChannelPostEntity,
    UpdateFeedChannelPostPayload,
} from 'group-api-client';
import { TypeOrmDataSourceSingleton } from 'third-party-clients';

export const updateFeedChannelPost = async (
    req: Request<unknown, unknown, UpdateFeedChannelPostPayload>,
    res: Response
) => {
    try {
        const { id, content, postedByUserId, title } = req.body;
        const dataSource = await TypeOrmDataSourceSingleton.getInstance();
        const updatedPost = await dataSource.manager.transaction(
            async (manager) => {
                await manager.update(
                    FeedChannelPostEntity,
                    { id, postedByUserId },
                    {
                        content,
                        title,
                        edited: true,
                    }
                );

                return manager.findOne(FeedChannelPostEntity, {
                    where: { id },
                });
            }
        );

        res.status(200).json(updatedPost);
    } catch (error) {
        console.error('Error updating feed channel post:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};
