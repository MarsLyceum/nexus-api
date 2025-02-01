import { Group } from '../models';

export type CreateGroupPayload = {
    createdByUserEmail: string;
    name: string;
};

export type GetGroupParams = {
    id: string;
};

export type GetUserGroupsParams = {
    email: string;
};

export type UpdateGroupParams = GetGroupParams;

export type UpdateGroupPayload = Omit<Group, 'id'>;

export type DeleteGroupParams = GetGroupParams;
