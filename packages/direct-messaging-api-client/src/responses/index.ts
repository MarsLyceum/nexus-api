import { Conversation, Message, MessageWithAttachmentUrls } from '../models';

export type GetConversationsResponse = Conversation[];

export type GetConversationMessagesResponse = MessageWithAttachmentUrls[];

export type CreateConversationResponse = Conversation;

export type SendMessageResponse = Message;

export type UpdateMessageResponse = Message;
