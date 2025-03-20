import { Conversation, Message } from '../models';

export type GetConversationsResponse = Conversation[];

export type GetConversationResponse = Conversation;

export type CreateConversationResponse = Conversation;

export type SendMessageResponse = Message;

export type UpdateMessageResponse = Message;
