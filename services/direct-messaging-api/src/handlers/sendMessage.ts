// handlers.ts

import { Request, Response } from 'express';
import {
    MessageEntity,
    ConversationEntity,
    SendMessagePayload,
    SendMessageParams,
} from 'direct-messaging-api-client';
import { TypeOrmDataSourceSingleton } from 'third-party-clients';

export const sendMessage = async (
    req: Request<SendMessageParams, unknown, SendMessagePayload>,
    res: Response
) => {
    try {
        const { conversationId } = req.params;
        const { id, content, senderUserId } = req.body;
        const dataSource = await TypeOrmDataSourceSingleton.getInstance();

        const newMessage = await dataSource.manager.transaction(
            async (manager) => {
                const conversation = await manager.findOne(ConversationEntity, {
                    where: { id: conversationId },
                    relations: ['messages'],
                });

                if (!conversation) {
                    throw new Error('Invalid conversation id');
                }

                const message = await manager.create(MessageEntity, {
                    id,
                    content,
                    conversation,
                    senderUserId,
                    edited: false,
                });

                await manager.save(message);

                conversation.messages = [...conversation.messages, message];
                await manager.save(conversation);

                return message;
            }
        );

        res.status(201).json(newMessage);
    } catch (error) {
        console.error('Error creating message:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};
