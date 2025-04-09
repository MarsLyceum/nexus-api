// handlers.ts

import { Request, Response } from 'express';
import {
    MessageEntity,
    GetConversationMessagesParams,
    GetConversationMessagesQueryParams,
} from 'direct-messaging-api-client';
import { TypeOrmDataSourceSingleton } from 'third-party-clients';

export const getConversationMessages = async (
    req: Request<
        GetConversationMessagesParams,
        unknown,
        unknown,
        GetConversationMessagesQueryParams
    >,
    res: Response
) => {
    try {
        const { conversationId } = req.params;
        const { offset: offsetQuery, limit: limitQuery } = req.query;
        const offset = Number.parseInt(offsetQuery || '0', 10);
        const limit = Number.parseInt(limitQuery || '100', 10);
        if (!conversationId) {
            res.status(400).send('Conversation ID parameter is missing');
            return;
        }
        const dataSource = await TypeOrmDataSourceSingleton.getInstance();

        const messages = await dataSource.getRepository(MessageEntity).find({
            where: { conversation: { id: conversationId } }, // Filter messages for the specific conversation
            order: { createdAt: 'DESC' }, // Order messages by creation date
            skip: offset, // Number of messages to skip (offset)
            take: limit, // Maximum number of messages to retrieve (limit)
        });

        if (!messages) {
            res.status(404).send('No messages found');
        } else {
            res.status(200).json(messages);
        }
    } catch (error) {
        res.status(500).send((error as Error).message);
    }
};
