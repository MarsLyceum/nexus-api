// Discriminated union for messages

export type BaseGroupChannelMessage = {
    id: string;
    content: string;
    postedAt: Date;
    edited: boolean;
    channel: GroupChannel;
    channelId: string;
    postedByUserId: string;
    attachmentFilePaths?: string[];
};

export type GroupChannelRegularMessage = BaseGroupChannelMessage & {
    messageType: 'message'; // for regular messages
};

export type GroupChannelPostMessage = BaseGroupChannelMessage & {
    messageType: 'post'; // discriminator value for posts
    title: string;
    flair?: string;
    domain?: string;
    thumbnail?: string;
    upvotes: number;
    commentsCount: number;
    shareCount: number;
};

export type GroupChannelMessage =
    | GroupChannelRegularMessage
    | GroupChannelPostMessage;

export type GroupChannelMessageWithAttachmentUrls = Omit<
    GroupChannelMessage,
    'attachmentFilePaths'
> & { attachmentUrls?: string[] };

export type PostWithAttachmentUrls = Omit<
    GroupChannelPostMessage,
    'attachmentFilePaths'
> & { attachmentUrls?: string[] };

// New type for post comments (reflecting GroupChannelPostCommentEntity)
export type GroupChannelPostComment = {
    id: string;
    content: string;
    postedAt: Date;
    edited: boolean;
    postedByUserId: string;
    // Reference to the parent post (GroupChannelPostMessage)
    postId: string;
    // For threaded replies, optional parent comment id
    parentCommentId?: string | null;
    // Nested replies
    children?: GroupChannelPostComment[];
    upvotes: number;
    attachmentFilePaths?: string[];
};

export type GroupChannelPostCommentWithAttachmentUrls = Omit<
    GroupChannelPostComment,
    'attachmentFilePaths'
> & { attachmentUrls?: string[] };

export type GroupRole = 'owner' | 'admin' | 'moderator' | 'member';
export type ChannelType = 'text' | 'voice' | 'feed';

export type GroupMember = {
    userId: string;
    groupId: string;
    role: GroupRole;
    joinedAt: Date;
    group: Group;
};

export type GroupChannel = {
    id: string;
    name: string;
    type: ChannelType;
    createdAt: Date;
    // The messages on a channel can be either regular messages or posts.
    messages: GroupChannelMessage[];
    groupId: string;
    group: Group;
    orderIndex: number;
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
    publicGroup: boolean;
};

export type GroupWithImage = Omit<Group, 'avatarFilePath'> & {
    avatarUrl: string;
};
