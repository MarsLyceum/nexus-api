import {
    Group,
    TextChannelMessage,
    FeedChannelPostComment,
    FeedChannelPost,
    GroupWithImage,
    TextChannelMessageWithAttachmentUrls,
    FeedChannelPostCommentWithAttachmentUrls,
    PostWithAttachmentUrls,
} from '../models';

export type CreateTextChannelMessageResponse = TextChannelMessage;

export type CreateFeedChannelPostResponse = FeedChannelPost;

export type CreateGroupResponse = Group;

export type GetGroupResponse = Group;

export type GetPostResponse = FeedChannelPost;
export type GetPostResponseWithAttachmentUrls = PostWithAttachmentUrls;

export type GetUserGroupsResponse = Group[];
export type GetUserGroupsWithImagesResponse = GroupWithImage[];

export type GetTextChannelMessagesResponse = TextChannelMessage[];
export type GetTextChannelMessagesResponseWithAttachmentUrls =
    TextChannelMessageWithAttachmentUrls[];

export type GetFeedChannelPostsResponse = FeedChannelPost[];
export type GetFeedChannelPostsResponseWithAttachmentUrls =
    PostWithAttachmentUrls[];

export type GetPostCommentsResponse = FeedChannelPostComment[];
export type GetPostCommentsResponseWithAttachmentUrls =
    FeedChannelPostCommentWithAttachmentUrls[];
export type CreatePostCommentResponse = FeedChannelPostComment;

export type UpdateGroupResponse = Group;
