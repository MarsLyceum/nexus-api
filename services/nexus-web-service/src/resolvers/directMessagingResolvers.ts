import { withFilter } from 'graphql-subscriptions';

import {
    DirectMessagingApiClient,
    GetConversationsParams,
    GetConversationsResponse,
    GetConversationMessagesParams,
    GetConversationMessagesResponse,
    CreateConversationPayload,
    CreateConversationResponse,
    SendMessageParams,
    SendMessagePayload,
    SendMessageResponse,
    UpdateMessageParams,
    UpdateMessagePayload,
    UpdateMessageResponse,
    DeleteMessageParams,
    MessageWithAttachmentUrls,
} from 'direct-messaging-api-client';

import { fetchAttachmentsForDm } from '../utils';

export const directMessagingResolvers = {
    Mutation: {
        createConversation: (
            _: never,
            payload: CreateConversationPayload
        ): Promise<CreateConversationResponse> => {
            const client = new DirectMessagingApiClient();
            return client.createConversation(payload);
        },
        sendMessage: (
            _: never,
            {
                conversationId,
                attachments,
                ...payload
            }: SendMessageParams &
                SendMessagePayload & {
                    attachments?: Promise<File>[];
                }
        ): Promise<SendMessageResponse> => {
            const client = new DirectMessagingApiClient();
            return client.sendMessage(conversationId, payload, attachments);
        },
        updateMessage: (
            _: never,
            {
                conversationId,
                ...payload
            }: UpdateMessageParams & UpdateMessagePayload
        ): Promise<UpdateMessageResponse> => {
            const client = new DirectMessagingApiClient();
            return client.updateMessage(conversationId, payload);
        },
        deleteMessage: async (
            _: never,
            { messageId }: DeleteMessageParams
        ): Promise<boolean> => {
            const client = new DirectMessagingApiClient();
            await client.deleteMessage(messageId);
            return true;
        },
    },
    Query: {
        getConversations: (
            _: never,
            { userId }: GetConversationsParams
        ): Promise<GetConversationsResponse> => {
            const client = new DirectMessagingApiClient();
            return client.getConversations(userId);
        },
        getConversationMessages: async (
            _: never,
            {
                conversationId,
                offset,
                limit,
            }: GetConversationMessagesParams & { offset: number; limit: number }
        ): Promise<GetConversationMessagesResponse> => {
            const client = new DirectMessagingApiClient();
            const messages = await client.getConversationMessages(
                conversationId,
                offset,
                limit
            );

            const messagesWithAttachments: MessageWithAttachmentUrls[] =
                await Promise.all(
                    messages.map((element) => fetchAttachmentsForDm(element))
                );

            return messagesWithAttachments;
        },
    },
    Subscription: {
        dmAdded: {
            subscribe: withFilter(
                (_, __, context) =>
                    context.pubsub.asyncIterableIterator('DM_ADDED'),
                (payload, variables) =>
                    // Only forward the event if the channelIds match
                    payload.dmAdded.conversation.id === variables.conversationId
            ),
        },
    },
};
