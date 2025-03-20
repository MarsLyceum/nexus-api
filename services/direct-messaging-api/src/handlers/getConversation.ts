// handlers.ts

import { Request, Response } from 'express';
import {
    ConversationEntity,
    GetConversationParams,
} from 'direct-messaging-api-client';
import { TypeOrmDataSourceSingleton } from 'third-party-clients';

export const getConversation = async (
    req: Request<GetConversationParams>,
    res: Response
) => {
    try {
        const { conversationId } = req.params;
        if (!conversationId) {
            res.status(400).send('Conversation ID parameter is missing');
            return;
        }
        const dataSource = await TypeOrmDataSourceSingleton.getInstance();

        const conversation = await dataSource.manager.find(ConversationEntity, {
            where: { id: conversationId },
            relations: ['messages'],
        });

        if (!conversation) {
            res.status(404).send('Conversation not found');
        } else {
            res.status(200).json(conversation);
        }
    } catch (error) {
        res.status(500).send((error as Error).message);
    }
};
