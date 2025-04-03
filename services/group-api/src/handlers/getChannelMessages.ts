import { Request, Response } from 'express';
import {
    GroupChannelMessageEntity,
    GetChannelMessagesParams,
    GetChannelMessagesQueryParams,
} from 'group-api-client';
import { TypeOrmDataSourceSingleton } from 'third-party-clients';

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
        const { offset: offsetQuery, limit: limitQuery } = req.query;
        const offset = Number.parseInt(offsetQuery || '0', 10);
        const limit = Number.parseInt(limitQuery || '100', 10);

        if (!channelId) {
            res.status(400).send('Channel ID parameter is missing');
            return;
        }

        const dataSource = await TypeOrmDataSourceSingleton.getInstance();

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
