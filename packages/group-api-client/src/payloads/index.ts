import { Group } from '../models';

export type CreateGroupChannelMessagePayload = {
    postedByUserId: string;
    channelId: string;
    content: string;
};

export type CreateGroupPayload = {
    createdByUserId: string;
    name: string;
};

export type GetGroupParams = {
    id: string;
};

export type GetUserGroupsParams = {
    userId: string;
};

export type UpdateGroupParams = GetGroupParams;

export type UpdateGroupPayload = Omit<Group, 'id'>;

export type DeleteGroupParams = GetGroupParams;
