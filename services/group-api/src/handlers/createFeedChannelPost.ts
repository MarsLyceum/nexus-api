// handlers.ts

import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

import {
    GroupChannelEntity,
    FeedChannelPostEntity,
    CreateFeedChannelPostPayload,
} from 'group-api-client';
import {
    GoogleCloudStorageSingleton,
    GooglePubSubClientSingleton,
    TypeOrmDataSourceSingleton,
} from 'third-party-clients';

export const createFeedChannelPost = async (
    req: Request<unknown, unknown, CreateFeedChannelPostPayload>,
    res: Response
) => {
    try {
        const dataSource = await TypeOrmDataSourceSingleton.getInstance();
        const filePaths: string[] = [];
        const pubsub = GooglePubSubClientSingleton.getInstance();

        if (req.files) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            // @ts-expect-error types is wrong
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            const { attachments } = req.files;

            // eslint-disable-next-line no-plusplus, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
            for (const [i, file] of attachments.entries()) {
                // Generate a unique file name for each file
                const filePath = `${Date.now()}_${i}`;

                // Upload the file buffer to Supabase Storage.

                // eslint-disable-next-line no-await-in-loop
                await GoogleCloudStorageSingleton.getInstance()
                    .bucket('nexus-post-attachments')
                    .file(filePath)
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                    .save(file.buffer, {
                        metadata: { contentType: file.mimetype },
                    });

                // Store the file path for further use.
                filePaths.push(filePath);
            }
        }

        // Wrap the operations in a transaction.
        const newMessage = await dataSource.manager.transaction(
            async (manager) => {
                // Retrieve the channel within the transaction.
                const groupChannel = await manager.findOne(GroupChannelEntity, {
                    where: { id: req.body.channelId },
                    relations: ['group', 'messages'],
                });

                if (!groupChannel) {
                    // Throw an error to abort the transaction.
                    throw new Error('Invalid channel id');
                }

                const {
                    id,
                    content,
                    channelId,
                    postedByUserId,
                    title,
                    flair,
                    domain,
                    thumbnail,
                } = req.body;

                const post = manager.create(FeedChannelPostEntity, {
                    id: id || uuidv4(),
                    content,
                    channelId,
                    postedByUserId,
                    postedAt: new Date(),
                    attachmentFilePaths: filePaths,
                    edited: false,
                    channel: groupChannel,
                    title,
                    flair,
                    domain,
                    thumbnail,
                    upvotes: 0,
                    commentsCount: 0,
                    shareCount: 0,
                });

                // Save the new message.
                await manager.save(post);

                await manager.save(groupChannel);

                return post;
            }
        );

        const groupChannel = await dataSource.manager.findOne(
            GroupChannelEntity,
            {
                where: { id: req.body.channelId },
                relations: ['group', 'messages'],
            }
        );

        if (groupChannel?.group.members) {
            const dataBuffer = Buffer.from(
                JSON.stringify({
                    type: 'new-message',
                    payload: newMessage,
                })
            );

            for (const member of groupChannel.group.members) {
                const topicName = `u-${member.userId}`;
                const topic = pubsub.topic(topicName);

                await topic.publishMessage({ data: dataBuffer });
            }
        }

        res.status(201).json(newMessage);
    } catch (error) {
        // If the error message is 'Invalid channel id', return 404.
        if ((error as Error).message === 'Invalid channel id') {
            res.status(404).json({ error: 'Invalid channel id' });
        } else {
            res.status(500).send((error as Error).message);
        }
    }
};
