import {
    GroupApiClient,
    CreateGroupPayload,
    UpdateGroupPayload,
    CreateGroupResponse,
    GetGroupResponse,
    GetUserGroupsResponse,
    GetChannelMessagesResponse,
    UpdateGroupResponse,
    CreateGroupChannelMessagePayload,
    CreateGroupChannelMessageResponse,
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
        fetchChannelMessages: async (
            _: unknown,
            { channelId, offset }: { channelId: string; offset: number }
        ): Promise<GetChannelMessagesResponse> => {
            const client = new GroupApiClient();
            const messages = await client.getChannelMessages(channelId, offset);
            return messages;
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

        createGroupChannelMessage: async (
            _: unknown,
            payload: CreateGroupChannelMessagePayload
        ): Promise<CreateGroupChannelMessageResponse> => {
            const client = new GroupApiClient();
            const group = await client.createGroupChannelMessage(payload);
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
