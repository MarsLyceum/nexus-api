import type { Conversation } from './Conversation';

export type Message = {
    id: string;
    content: string;
    conversation: Conversation;
    senderUserId: string;
    createdAt: Date;
    attachmentFilePaths?: string[];
    edited: boolean;
};

export type MessageWithAttachmentUrls = Omit<Message, 'attachmentFilePaths'> & {
    attachmentUrls?: string[];
};
