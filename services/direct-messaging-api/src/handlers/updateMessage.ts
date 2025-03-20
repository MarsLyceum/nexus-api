// handlers.ts

import { Request, Response } from 'express';
import {
    MessageEntity,
    ConversationEntity,
    UpdateMessagePayload,
    UpdateMessageParams,
} from 'direct-messaging-api-client';
import { TypeOrmDataSourceSingleton } from 'third-party-clients';

export const updateMessage = async (
    req: Request<UpdateMessageParams, unknown, UpdateMessagePayload>,
    res: Response
) => {
    try {
        const { conversationId } = req.params;
        const { id, content, senderUserId } = req.body;
        const dataSource = await TypeOrmDataSourceSingleton.getInstance();

        const updatedMessage = await dataSource.manager.transaction(
            async (manager) => {
                const conversation = await manager.findOne(ConversationEntity, {
                    where: { id: conversationId },
                    relations: ['messages'],
                });

                if (!conversation) {
                    throw new Error('Invalid conversation id');
                }

                await manager.update(
                    MessageEntity,
                    { id },
                    {
                        content,
                        conversation,
                        senderUserId,
                        edited: true,
                    }
                );

                const updatedMessageInternal = await manager.findOne(
                    MessageEntity,
                    {
                        where: { id },
                    }
                );

                if (updatedMessageInternal) {
                    conversation.messages = conversation.messages.map((msg) =>
                        msg.id === updatedMessageInternal.id
                            ? updatedMessageInternal
                            : msg
                    );
                    await manager.save(conversation);
                }

                return updatedMessageInternal;
            }
        );

        res.status(204).json(updatedMessage);
    } catch (error) {
        console.error('Error updating message:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};
