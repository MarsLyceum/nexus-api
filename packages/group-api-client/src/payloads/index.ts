import { ParsedQs } from 'qs';
import { Group, ChannelType, FeedChannelPost } from '../models';

export type CreateFeedChannelPostCommentPayload = {
    content: string;
    postedByUserId: string;
    postId: string;
    parentCommentId?: string | null; // Optional for top-level comments
    hasChildren: boolean;
    upvotes?: number; // Defaults to 0 if not provided
};

export type CreateTextChannelMessagePayload = {
    id?: string;
    postedByUserId: string;
    channelId: string;
    content: string;
};

export type CreateFeedChannelPostPayload = {
    id?: string;
    postedByUserId: string;
    channelId: string;
    content: string;

    title: string;
    flair?: string;
    domain?: string;
    thumbnail?: string;
};

export type CreateGroupPayload = {
    createdByUserId: string;
    publicGroup: boolean;
    name: string;
};

export type CreateGroupChannelPayload = {
    groupId: string;
    type: ChannelType;
    name: string;
};

export type UpdateTextChannelMessagePayload = {
    id: string;
    content: string;
    postedByUserId: string;
};

export type UpdateFeedChannelPostPayload = FeedChannelPost;

export type GetGroupParams = {
    id: string;
};

export type GetPostParams = {
    id: string;
};

export type GetUserGroupsParams = {
    userId: string;
};

export type DeleteTextChannelMessageParams = {
    id: string;
};

export type GetTextChannelMessagesParams = {
    channelId: string;
};

export type GetFeedChannelPostsParams = {
    channelId: string;
};

export type GetPostCommentsParams = {
    postId: string;
};

export type GetPostCommentsQueryParams = ParsedQs & {
    offset?: string;
    limit?: string;
    parentCommentId?: string;
};

export type GetTextChannelMessagesQueryParams = ParsedQs & {
    offset: string;
    limit?: string;
};

export type GetFeedChannelPostsQueryParams = ParsedQs & {
    offset: string;
    limit?: string;
};

export type UpdateGroupParams = GetGroupParams;

export type UpdateGroupPayload = Omit<Group, 'id'>;

export type DeleteGroupParams = GetGroupParams;
