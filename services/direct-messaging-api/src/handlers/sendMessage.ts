// handlers.ts

import { Request, Response } from 'express';
import {
    MessageEntity,
    ConversationEntity,
    SendMessagePayload,
    SendMessageParams,
} from 'direct-messaging-api-client';
import {
    TypeOrmDataSourceSingleton,
    GooglePubSubClientSingleton,
    GoogleCloudStorageSingleton,
} from 'third-party-clients';

export const sendMessage = async (
    req: Request<SendMessageParams, unknown, SendMessagePayload>,
    res: Response
) => {
    try {
        const { conversationId } = req.params;
        const { id, content, senderUserId } = req.body;
        const dataSource = await TypeOrmDataSourceSingleton.getInstance();
        const pubsub = GooglePubSubClientSingleton.getInstance();
        const filePaths: string[] = [];

        if (req.files) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            // @ts-expect-error types is wrong
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            const { attachments } = req.files;

            // eslint-disable-next-line no-plusplus, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
            for (const [i, file] of attachments.entries()) {
                // Generate a unique file name for each file
                const filePath = `${Date.now()}_${i}`;

                // eslint-disable-next-line no-await-in-loop
                await GoogleCloudStorageSingleton.getInstance()
                    .bucket('dm-attachments')
                    .file(filePath)
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                    .save(file.buffer, {
                        metadata: { contentType: file.mimetype },
                    });

                // Store the file path for further use.
                filePaths.push(filePath);
            }
        }

        const newMessage = await dataSource.manager.transaction(
            async (manager) => {
                const conversation = await manager.findOne(ConversationEntity, {
                    where: { id: conversationId },
                    relations: ['messages'],
                });

                if (!conversation) {
                    throw new Error('Invalid conversation id');
                }

                console.log(
                    'Server current time (UTC):',
                    new Date().toISOString()
                );

                const message = manager.create(MessageEntity, {
                    id,
                    content,
                    conversation,
                    senderUserId,
                    attachmentFilePaths: filePaths,
                    createdAt: new Date(),
                    edited: false,
                });

                await manager.save(message);

                return message;
            }
        );

        const conversation = await dataSource.manager.findOne(
            ConversationEntity,
            {
                where: { id: conversationId },
            }
        );

        if (conversation?.participantsUserIds) {
            const dataBuffer = Buffer.from(
                JSON.stringify({
                    type: 'new-dm',
                    payload: newMessage,
                })
            );

            for (const userId of conversation.participantsUserIds) {
                const topicName = `u-${userId}`;
                const topic = pubsub.topic(topicName);

                await topic.publishMessage({ data: dataBuffer });
            }
        }

        res.status(201).json(newMessage);
    } catch (error) {
        console.error('Error creating message:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};
