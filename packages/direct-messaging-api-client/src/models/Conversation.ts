import type { Message } from './Message';

export type Conversation = {
    id: string;
    type: 'direct' | 'group' | 'moderator';
    participantsUserIds: string[];
    messages: Message[];
    channelId: string | null;
};
