// handlers.ts

import { Request, Response } from 'express';
import {
    ConversationEntity,
    CreateConversationPayload,
} from 'direct-messaging-api-client';
import { TypeOrmDataSourceSingleton } from 'third-party-clients';

export const createConversation = async (
    req: Request<unknown, unknown, CreateConversationPayload>,
    res: Response
) => {
    try {
        const { type, participantsUserIds, channelId } = req.body;
        const dataSource = await TypeOrmDataSourceSingleton.getInstance();
        const conversationRepository =
            dataSource.getRepository(ConversationEntity);

        // Create a sorted copy of the incoming participants for later comparison.
        const sortedInputParticipants = [...participantsUserIds].sort();

        // Build a query to get candidate conversations matching type and channelId.
        // We also ensure the candidate conversation has the same number of participants.
        const query = conversationRepository
            .createQueryBuilder('conversation')
            .leftJoinAndSelect('conversation.messages', 'messages')
            .where('conversation.type = :type', { type });

        if (channelId) {
            query.andWhere('conversation.channelId = :channelId', {
                channelId,
            });
        } else {
            query.andWhere('conversation.channelId IS NULL');
        }

        // Use PostgreSQL's cardinality function to match the number of participants.
        query.andWhere(
            'cardinality(conversation.participantsUserIds) = :count',
            {
                count: sortedInputParticipants.length,
            }
        );

        const candidateConversations = await query.getMany();

        // Find a conversation where the sorted participants match.
        const existingConversation = candidateConversations.find((conv) => {
            const sortedConvParticipants = [...conv.participantsUserIds].sort();
            return sortedConvParticipants.every(
                (id, index) => id === sortedInputParticipants[index]
            );
        });

        if (existingConversation) {
            // Matching conversation exists, return it with a 200 OK.
            res.status(200).json(existingConversation);
            return;
        }

        // No matching conversation found, create a new one.
        const newConversation = conversationRepository.create({
            type,
            participantsUserIds, // Store as provided or sorted, depending on your needs.
            channelId: channelId || null,
            messages: [],
        });
        await conversationRepository.save(newConversation);
        res.status(201).json(newConversation);
    } catch (error) {
        console.error('Error creating conversation:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};
