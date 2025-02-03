import {
    GroupApiClient,
    CreateGroupPayload,
    UpdateGroupPayload,
    CreateGroupResponse,
    GetGroupResponse,
    GetUserGroupsResponse,
    UpdateGroupResponse,
} from 'group-api-client';

export const groupResolvers = {
    Query: {
        fetchGroup: async (
            _: unknown,
            { id }: { id: string }
        ): Promise<GetGroupResponse> => {
            const client = new GroupApiClient();
            const group = await client.getGroup(id);
            return group;
        },
        fetchUserGroups: async (
            _: unknown,
            { userId }: { userId: string }
        ): Promise<GetUserGroupsResponse> => {
            const client = new GroupApiClient();
            const groups = await client.getUserGroups(userId);
            return groups;
        },
    },
    Mutation: {
        createGroup: async (
            _: unknown,
            payload: CreateGroupPayload
        ): Promise<CreateGroupResponse> => {
            const client = new GroupApiClient();
            const group = await client.createGroup(payload);
            return group;
        },
        updateGroup: async (
            _: unknown,
            args: { id: string; data: UpdateGroupPayload }
        ): Promise<UpdateGroupResponse> => {
            const client = new GroupApiClient();
            const group = await client.updateGroup(args.id, args.data);
            return group;
        },
        deleteGroup: async (
            _: unknown,
            { id }: { id: string }
        ): Promise<undefined> => {
            const client = new GroupApiClient();
            return await client.deleteGroup(id);
        },
    },
};
