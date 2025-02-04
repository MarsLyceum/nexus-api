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

            let sanitizedPayload: CreateGroupChannelMessagePayload;

            // If it's a post message, sanitize post-specific fields.
            if (payload.messageType === 'post') {
                sanitizedPayload = {
                    ...payload,
                    flair: payload.flair === '' ? undefined : payload.flair,
                    domain: payload.domain === '' ? undefined : payload.domain,
                    thumbnail:
                        payload.thumbnail === ''
                            ? undefined
                            : payload.thumbnail,
                };
            } else {
                // For a regular message, simply use the payload as-is.
                sanitizedPayload = payload;
            }

            const message =
                await client.createGroupChannelMessage(sanitizedPayload);
            return message;
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
    // __resolveType on the GroupChannelMessage interface
    GroupChannelMessage: {
        __resolveType(obj: any) {
            // Use messageType if provided.
            if (obj.messageType === 'post') {
                return 'PostMessage';
            }
            if (obj.messageType === 'message') {
                return 'RegularMessage';
            }
            // Otherwise, infer based on extra fields.
            if (
                Object.prototype.hasOwnProperty.call(obj, 'upvotes') ||
                Object.prototype.hasOwnProperty.call(obj, 'commentsCount') ||
                Object.prototype.hasOwnProperty.call(obj, 'shareCount')
            ) {
                return 'PostMessage';
            }
            return 'RegularMessage';
        },
    },
};
