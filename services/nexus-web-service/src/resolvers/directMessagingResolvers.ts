import {
    DirectMessagingApiClient,
    GetConversationsParams,
    GetConversationsResponse,
    GetConversationMessagesParams,
    GetConversationMessagesQueryParams,
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
} from 'direct-messaging-api-client';

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
                ...payload
            }: SendMessageParams & SendMessagePayload
        ): Promise<SendMessageResponse> => {
            const client = new DirectMessagingApiClient();
            return client.sendMessage(conversationId, payload);
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
        getConversationMessages: (
            _: never,
            {
                conversationId,
                offset,
                limit,
            }: GetConversationMessagesParams & { offset: number; limit: number }
        ): Promise<GetConversationMessagesResponse> => {
            const client = new DirectMessagingApiClient();
            return client.getConversationMessages(
                conversationId,
                offset,
                limit
            );
        },
    },
    Subscription: {},
};
