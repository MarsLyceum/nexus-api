export type GroupRole = 'owner' | 'admin' | 'moderator' | 'member';
export type ChannelType = 'text' | 'voice' | 'feed';

export type GroupMember = {
    userId: string;
    groupId: string;
    role: GroupRole;
    joinedAt: Date;
    group: Group;
};

export type GroupChannelMessage = {
    id: string;
    content: string;
    postedAt: Date;
    edited: boolean;
    channel: GroupChannel;
    channelId: string;
    postedByUserId: string;
};

export type GroupChannel = {
    id: string;
    name: string;
    type: ChannelType;
    createdAt: Date;
    messages: GroupChannelMessage[];
    groupId: string;
    group: Group;
};

export type Group = {
    id: string;
    name: string;
    createdByUserId: string;
    createdAt: Date;
    members: GroupMember[];
    channels: GroupChannel[];
    description?: string;
    avatarFilePath?: string;
};
