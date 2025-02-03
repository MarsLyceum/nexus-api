import { Group, GroupChannelMessage } from '../models';

export type CreateGroupChannelMessageResponse = GroupChannelMessage;

export type CreateGroupResponse = Group;

export type GetGroupResponse = Group;

export type GetUserGroupsResponse = Group[];

export type GetChannelMessagesResponse = GroupChannelMessage[];

export type UpdateGroupResponse = Group;
