import { Request, Response } from 'express';
import {
    TextChannelMessageEntity,
    UpdateTextChannelMessagePayload,
} from 'group-api-client';
import { TypeOrmDataSourceSingleton } from 'third-party-clients';

export const updateTextChannelMessage = async (
    req: Request<unknown, unknown, UpdateTextChannelMessagePayload>,
    res: Response
) => {
    try {
        const { id, content, postedByUserId } = req.body;
        const dataSource = await TypeOrmDataSourceSingleton.getInstance();
        const updatedMessage = await dataSource.manager.transaction(
            async (manager) => {
                await manager.update(
                    TextChannelMessageEntity,
                    { id, postedByUserId },
                    {
                        content,
                        edited: true,
                    }
                );

                return manager.findOne(TextChannelMessageEntity, {
                    where: { id },
                });
            }
        );

        res.status(200).json(updatedMessage);
    } catch (error) {
        console.error('Error updating text channel message:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};
