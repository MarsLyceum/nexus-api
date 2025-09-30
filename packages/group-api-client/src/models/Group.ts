// eslint-disable-next-line eslint-comments/disable-enable-pair
/* eslint-disable no-use-before-define */

export type TextChannelMessage = {
    id: string;
    content: string;
    postedAt: Date;
    edited: boolean;
    channel: GroupChannel;
    channelId: string;
    postedByUserId: string;
    attachmentFilePaths?: string[];
};

export type FeedChannelPost = {
    id: string;
    content: string;
    postedAt: Date;
    edited: boolean;
    channel: GroupChannel;
    channelId: string;
    postedByUserId: string;
    attachmentFilePaths?: string[];

    title: string;
    flair?: string;
    domain?: string;
    thumbnail?: string;
    upvotes: number;
    commentsCount: number;
    shareCount: number;
};

export type TextChannelMessageWithAttachmentUrls = Omit<
    TextChannelMessage,
    'attachmentFilePaths'
> & { attachmentUrls?: string[] };

export type PostWithAttachmentUrls = Omit<
    FeedChannelPost,
    'attachmentFilePaths'
> & { attachmentUrls?: string[] };

// New type for post comments (reflecting FeedChannelPostCommentEntity)
export type FeedChannelPostComment = {
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
    children?: FeedChannelPostComment[];
    upvotes: number;
    attachmentFilePaths?: string[];
};

export type FeedChannelPostCommentWithAttachmentUrls = Omit<
    FeedChannelPostComment,
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
