import {
    Group,
    GroupChannelMessage,
    GroupChannelPostComment,
    GroupChannelPostMessage,
    GroupWithImage,
    GroupChannelMessageWithAttachmentUrls,
    GroupChannelPostCommentWithAttachmentUrls,
    PostWithAttachmentUrls,
} from '../models';

export type CreateGroupChannelMessageResponse = GroupChannelMessage;

export type CreateGroupResponse = Group;

export type GetGroupResponse = Group;

export type GetPostResponse = GroupChannelPostMessage;
export type GetPostResponseWithAttachmentUrls = PostWithAttachmentUrls;

export type GetUserGroupsResponse = Group[];
export type GetUserGroupsWithImagesResponse = GroupWithImage[];

export type GetChannelMessagesResponse = GroupChannelMessage[];
export type GetChannelMessagesResponseWithAttachmentUrls =
    GroupChannelMessageWithAttachmentUrls[];

export type GetPostCommentsResponse = GroupChannelPostComment[];
export type GetPostCommentsResponseWithAttachmentUrls =
    GroupChannelPostCommentWithAttachmentUrls[];
export type CreatePostCommentResponse = GroupChannelPostComment;

export type UpdateGroupResponse = Group;
