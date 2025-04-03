import { Conversation, Message } from '../models';

export type GetConversationsResponse = Conversation[];

export type GetConversationMessagesResponse = Message[];

export type CreateConversationResponse = Conversation;

export type SendMessageResponse = Message;

export type UpdateMessageResponse = Message;
