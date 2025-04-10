import { Request, Response } from 'express';
import {
    ConversationEntity,
    CloseConversationParams,
    CloseConversationPayload,
} from 'direct-messaging-api-client';
import { TypeOrmDataSourceSingleton } from 'third-party-clients';

export const closeConversation = async (
    req: Request<CloseConversationParams, unknown, CloseConversationPayload>,
    res: Response
) => {
    try {
        const { conversationId } = req.params;
        const { closedByUserId } = req.body;
        const dataSource = await TypeOrmDataSourceSingleton.getInstance();

        // eslint-disable-next-line consistent-return
        await dataSource.manager.transaction(async (manager) => {
            const conversation = await manager.findOne(ConversationEntity, {
                where: { id: conversationId },
            });
            if (!conversation) {
                return res
                    .status(404)
                    .json({ message: 'Conversation not found' });
            }

            // Update the closedByUserIds array if currentUserId is not already included
            if (!conversation.closedByUserIds.includes(closedByUserId)) {
                conversation.closedByUserIds.push(closedByUserId);
            }

            await manager.save(conversation);
        });

        res.status(204).send();
    } catch (error) {
        console.error('Error deleting message:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};
