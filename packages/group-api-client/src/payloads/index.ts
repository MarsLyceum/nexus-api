import { ParsedQs } from 'qs';
import { Group, ChannelType } from '../models';

/**
 * Create a channel message payload.
 * We define two variants:
 *  - Regular message: just content.
 *  - Post message: includes extra post fields.
 */
export type CreateGroupChannelRegularMessagePayload = {
    postedByUserId: string;
    channelId: string;
    content: string;
    messageType: 'message'; // regular message discriminator
};

export type CreateGroupChannelPostMessagePayload = {
    postedByUserId: string;
    channelId: string;
    content: string;
    messageType: 'post'; // discriminator value for posts
    title: string;
    flair?: string;
    domain?: string;
    thumbnail?: string;
};

export type CreateGroupChannelPostCommentPayload = {
    content: string;
    postedByUserId: string;
    postId: string;
    parentCommentId?: string | null; // Optional for top-level comments
    children?: CreateGroupChannelPostCommentPayload[]; // Nested replies
    upvotes?: number; // Defaults to 0 if not provided
};

export type CreateGroupChannelMessagePayload =
    | CreateGroupChannelRegularMessagePayload
    | CreateGroupChannelPostMessagePayload;

export type CreateGroupPayload = {
    createdByUserId: string;
    name: string;
};

export type CreateGroupChannelPayload = {
    groupId: string;
    type: ChannelType;
    name: string;
};

export type GetGroupParams = {
    id: string;
};

export type GetUserGroupsParams = {
    userId: string;
};

export type GetChannelMessagesParams = {
    channelId: string;
};

export type GetPostCommentsParams = {
    postId: string;
};

export type GetPostCommentsQueryParams = ParsedQs & {
    offset?: string;
    limit?: string;
};

export type GetChannelMessagesQueryParams = ParsedQs & {
    offset: string;
};

export type UpdateGroupParams = GetGroupParams;

export type UpdateGroupPayload = Omit<Group, 'id'>;

export type DeleteGroupParams = GetGroupParams;
