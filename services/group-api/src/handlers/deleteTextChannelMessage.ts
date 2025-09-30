import { Request, Response } from 'express';

import {
    TextChannelMessageEntity,
    DeleteTextChannelMessageParams,
} from 'group-api-client';
import {
    GoogleCloudStorageSingleton,
    TypeOrmDataSourceSingleton,
} from 'third-party-clients';

export const deleteTextChannelMessage = async (
    req: Request<DeleteTextChannelMessageParams, unknown, unknown>,
    res: Response
) => {
    try {
        const { id } = req.params;
        const dataSource = await TypeOrmDataSourceSingleton.getInstance();
        const googleCloudStorage = GoogleCloudStorageSingleton.getInstance();

        const message = await dataSource.manager.findOne(
            TextChannelMessageEntity,
            {
                where: { id },
            }
        );

        if (message && message.attachmentFilePaths) {
            for (const attachmentFilePath of message.attachmentFilePaths) {
                await googleCloudStorage
                    .bucket('message-attachments')
                    .file(attachmentFilePath)
                    .delete();
            }
        }

        await dataSource.manager.delete(TextChannelMessageEntity, { id });

        res.status(204).send();
    } catch (error) {
        console.error('Error deleting text channel message:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};
