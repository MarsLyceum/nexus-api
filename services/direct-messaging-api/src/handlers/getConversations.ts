// handlers.ts

import { Request, Response } from 'express';
import {
    ConversationEntity,
    MessageEntity,
    GetConversationsParams,
} from 'direct-messaging-api-client';
import { TypeOrmDataSourceSingleton } from 'third-party-clients';

export const getConversations = async (
    req: Request<GetConversationsParams>,
    res: Response
) => {
    try {
        const { userId } = req.params;
        if (!userId) {
            res.status(400).send('User ID parameter is missing');
            return;
        }
        const dataSource = await TypeOrmDataSourceSingleton.getInstance();

        const messageSubQuery = dataSource
            .getRepository(MessageEntity)
            .createQueryBuilder('subMessage')
            .select('MAX(subMessage.createdAt)')
            .where('subMessage.conversationId = conversation.id')
            .getQuery();

        const conversations = await dataSource
            .getRepository(ConversationEntity)
            .createQueryBuilder('conversation')
            .leftJoinAndSelect('conversation.messages', 'message')
            .where(':userId = ANY(conversation.participantsUserIds)', {
                userId,
            })
            .orderBy(`(${messageSubQuery})`, 'DESC')
            .getMany();

        if (!conversations) {
            res.status(404).send('Conversations not found');
        } else {
            res.status(200).json(conversations);
        }
    } catch (error) {
        res.status(500).send((error as Error).message);
    }
};
