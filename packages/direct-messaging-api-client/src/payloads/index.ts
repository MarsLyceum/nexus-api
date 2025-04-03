import { ParsedQs } from 'qs';

export type CreateConversationPayload = {
    type: 'direct' | 'group' | 'moderator';
    participantsUserIds: string[];
    channelId?: string;
};

export type SendMessagePayload = {
    id: string;
    content: string;
    senderUserId: string;
};

export type UpdateMessagePayload = SendMessagePayload;

export type GetConversationsParams = {
    userId: string;
};

export type GetConversationMessagesParams = {
    conversationId: string;
};

export type GetConversationMessagesQueryParams = ParsedQs & {
    offset?: string;
    limit?: string;
};

export type SendMessageParams = {
    conversationId: string;
};

export type UpdateMessageParams = {
    conversationId: string;
};

export type DeleteMessageParams = {
    messageId: string;
};
