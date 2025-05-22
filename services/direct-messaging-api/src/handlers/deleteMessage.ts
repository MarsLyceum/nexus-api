import { Request, Response } from 'express';
import {
    MessageEntity,
    DeleteMessageParams,
} from 'direct-messaging-api-client';
import {
    GoogleCloudStorageSingleton,
    TypeOrmDataSourceSingleton,
} from 'third-party-clients';

export const deleteMessage = async (
    req: Request<DeleteMessageParams, unknown, unknown>,
    res: Response
) => {
    try {
        const { messageId } = req.params;
        const dataSource = await TypeOrmDataSourceSingleton.getInstance();
        const googleCloudStorage = GoogleCloudStorageSingleton.getInstance();

        const message = await dataSource.manager.findOne(MessageEntity, {
            where: { id: messageId },
        });

        if (message && message.attachmentFilePaths) {
            for (const attachmentFilePath of message.attachmentFilePaths) {
                await googleCloudStorage
                    .bucket('dm-attachments')
                    .file(attachmentFilePath)
                    .delete();
            }
        }

        await dataSource.manager.delete(MessageEntity, { id: messageId });

        res.status(204).send();
    } catch (error) {
        console.error('Error deleting message:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};
