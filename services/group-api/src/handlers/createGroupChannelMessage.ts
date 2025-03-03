// handlers.ts

import { Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import {
    GroupChannelEntity,
    GroupChannelMessageMessageEntity,
    GroupChannelPostEntity,
    CreateGroupChannelMessagePayload,
} from 'group-api-client';
import { initializeDataSource } from '../database';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;
const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Handler to create a channel message.
 * Supports two types:
 *   - Regular message (messageType: 'message')
 *   - Post message (messageType: 'post') with additional post fields.
 * All related operations are wrapped in a transaction.
 */
export const createGroupChannelMessage = async (
    req: Request<unknown, unknown, CreateGroupChannelMessagePayload>,
    res: Response
) => {
    try {
        const dataSource = await initializeDataSource();
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

                // Upload the file buffer to Supabase Storage.
                // eslint-disable-next-line no-await-in-loop
                const { error } = await supabaseClient.storage
                    .from('message-attachments')
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                    .upload(filePath, file.buffer, {
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
                        contentType: file.mimetype,
                        upsert: false,
                    });

                if (error) {
                    console.error(
                        'Error uploading file to Supabase:',
                        error.message
                    );
                    throw new Error('Failed to upload group avatar.');
                }

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

                let message:
                    | GroupChannelMessageMessageEntity
                    | GroupChannelPostEntity;

                // Check the payload type discriminator.
                if (req.body.messageType === 'post') {
                    const {
                        content,
                        channelId,
                        postedByUserId,
                        title,
                        flair,
                        domain,
                        thumbnail,
                    } = req.body;

                    message = manager.create(GroupChannelPostEntity, {
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
                } else {
                    const { content, channelId, postedByUserId } = req.body;

                    message = manager.create(GroupChannelMessageMessageEntity, {
                        content,
                        channelId,
                        postedByUserId,
                        attachmentFilePaths: filePaths,
                        postedAt: new Date(),
                        edited: false,
                        channel: groupChannel,
                    });
                }

                // Save the new message.
                await manager.save(message);

                // Optionally, update the channel's messages array.
                groupChannel.messages = [...groupChannel.messages, message];
                await manager.save(groupChannel);

                return message;
            }
        );

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
