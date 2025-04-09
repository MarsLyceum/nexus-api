import { Request, Response } from 'express';
import {
    MessageEntity,
    DeleteMessageParams,
} from 'direct-messaging-api-client';
import { TypeOrmDataSourceSingleton } from 'third-party-clients';

export const deleteMessage = async (
    req: Request<DeleteMessageParams, unknown, unknown>,
    res: Response
) => {
    try {
        const { messageId } = req.params;
        const dataSource = await TypeOrmDataSourceSingleton.getInstance();

        await dataSource.manager.transaction(async (manager) => {
            const message = await manager.findOne(MessageEntity, {
                where: { id: messageId },
                relations: ['conversation'],
            });

            if (!message) {
                throw new Error('Invalid message id');
            }

            await manager.delete(MessageEntity, { id: messageId });
        });

        res.status(204).send();
    } catch (error) {
        console.error('Error deleting message:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};
