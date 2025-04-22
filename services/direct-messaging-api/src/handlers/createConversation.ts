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
        const { type, participantsUserIds, channelId, requestedByUserId } =
            req.body;
        const dataSource = await TypeOrmDataSourceSingleton.getInstance();

        // Create a sorted copy of the incoming participants for later comparison.
        const sortedInputParticipants = [...participantsUserIds].sort();

        const newConversation = await dataSource.manager.transaction(
            async (manager) => {
                const conversationRepository =
                    manager.getRepository(ConversationEntity);

                // Build a query to get candidate conversations matching type and channelId.
                // We also ensure the candidate conversation has the same number of participants.
                const query = conversationRepository
                    .createQueryBuilder('conversation')
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
                const existingConversation = candidateConversations.find(
                    (conv) => {
                        const sortedConvParticipants = [
                            ...conv.participantsUserIds,
                        ].sort();
                        return sortedConvParticipants.every(
                            (id, index) => id === sortedInputParticipants[index]
                        );
                    }
                );

                if (existingConversation) {
                    if (
                        existingConversation.closedByUserIds?.includes(
                            requestedByUserId
                        )
                    ) {
                        existingConversation.closedByUserIds =
                            existingConversation.closedByUserIds.filter(
                                (id: string) => id !== requestedByUserId
                            );
                        await conversationRepository.save(existingConversation);
                    }
                    return existingConversation;
                }

                // No matching conversation found, create a new one.
                const newConv = conversationRepository.create({
                    type,
                    participantsUserIds: sortedInputParticipants, // Store as provided or sorted, depending on your needs.
                    channelId: channelId || null,
                    messages: [],
                });
                await conversationRepository.save(newConv);

                return newConv;
            }
        );

        res.status(201).json(newConversation);
    } catch (error) {
        console.error('Error creating conversation:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};
