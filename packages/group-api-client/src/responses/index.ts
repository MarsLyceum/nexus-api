import {
    Group,
    GroupChannelMessage,
    GroupChannelPostComment,
    GroupChannelPostMessage,
    GroupWithImage,
} from '../models';

export type CreateGroupChannelMessageResponse = GroupChannelMessage;

export type CreateGroupResponse = Group;

export type GetGroupResponse = Group;

export type GetPostResponse = GroupChannelPostMessage;

export type GetUserGroupsResponse = Group[];
export type GetUserGroupsWithImagesResponse = GroupWithImage[];

export type GetChannelMessagesResponse = GroupChannelMessage[];

export type GetPostCommentsResponse = GroupChannelPostComment[];

export type UpdateGroupResponse = Group;
