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

        // Subquery to get the latest message's createdAt timestamp for each conversation.
        const lastMessageCreatedAtSubQuery = dataSource
            .getRepository(MessageEntity)
            .createQueryBuilder('subMessage')
            .select('MAX(subMessage.createdAt)')
            .where('subMessage.conversationId = conversation.id')
            .getQuery();

        // Use leftJoinAndMapOne to fetch only the last message per conversation.
        const conversations = await dataSource
            .getRepository(ConversationEntity)
            .createQueryBuilder('conversation')
            .leftJoinAndMapOne(
                'conversation.lastMessage', // new property on ConversationEntity for the last message
                MessageEntity,
                'message',
                `message.conversationId = conversation.id AND message.createdAt = (${lastMessageCreatedAtSubQuery})`
            )
            .where(':userId = ANY(conversation.participantsUserIds)', {
                userId,
            })
            .andWhere('NOT (:userId = ANY(conversation.closedByUserIds))', {
                userId,
            })
            .orderBy('message.createdAt', 'DESC')
            .getMany();

        if (!conversations) {
            console.error(`No conversations found for user ${userId}`);
            res.status(404).send('Conversations not found');
        } else {
            res.status(200).json(conversations);
        }
    } catch (error) {
        console.error('Error fetching conversations:', error);
        res.status(500).send((error as Error).message);
    }
};
