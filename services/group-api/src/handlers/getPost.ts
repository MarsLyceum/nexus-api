import { Request, Response } from 'express';
import { FeedChannelPostEntity, GetPostParams } from 'group-api-client';
import { TypeOrmDataSourceSingleton } from 'third-party-clients';

export const getPost = async (req: Request<GetPostParams>, res: Response) => {
    try {
        const { id } = req.params;
        if (!id) {
            res.status(400).send('Group id parameter is missing');
            return;
        }

        const dataSource = await TypeOrmDataSourceSingleton.getInstance();
        const post = await dataSource.manager.findOne(FeedChannelPostEntity, {
            where: { id },
        });

        if (!post) {
            res.status(404).send('Post not found');
        } else {
            res.status(200).json(post);
        }
    } catch (error) {
        res.status(500).send((error as Error).message);
    }
};
