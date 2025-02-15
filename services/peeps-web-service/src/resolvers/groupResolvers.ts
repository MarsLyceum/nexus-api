import { GraphQLUpload } from 'graphql-upload-minimal';
import { createClient } from '@supabase/supabase-js';
import { Buffer } from 'node:buffer';
import {
    GroupApiClient,
    CreateGroupPayload,
    UpdateGroupPayload,
    CreateGroupResponse,
    GetGroupResponse,
    GetUserGroupsWithImagesResponse,
    GetChannelMessagesResponse,
    UpdateGroupResponse,
    CreateGroupChannelMessagePayload,
    CreateGroupChannelMessageResponse,
    GetPostCommentsResponse,
    GetPostResponse,
} from 'group-api-client';

import { SUPABASE_SERVICE_KEY, SUPABASE_URL } from '../config';

const supabaseUrl = SUPABASE_URL!;
const supabaseServiceKey = SUPABASE_SERVICE_KEY!;
const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

const blobToBase64 = async (blob: Blob): Promise<string> => {
    // Convert blob to an ArrayBuffer
    const arrayBuffer = await blob.arrayBuffer();
    // Convert the ArrayBuffer to a Node Buffer, then to a base64 string.
    const base64String = Buffer.from(arrayBuffer).toString('base64');
    // Return a Data URI with the blob's MIME type for easy use in an <Image> or <img> tag.
    return `data:${blob.type};base64,${base64String}`;
};

export const groupResolvers = {
    Upload: GraphQLUpload,

    Query: {
        fetchGroup: async (
            _: unknown,
            { id }: { id: string }
        ): Promise<GetGroupResponse> => {
            const client = new GroupApiClient();
            const group = await client.getGroup(id);
            return group;
        },
        fetchPost: async (
            _: unknown,
            { id }: { id: string }
        ): Promise<GetPostResponse> => {
            const client = new GroupApiClient();
            const post = await client.getPost(id);
            return post;
        },
        fetchUserGroups: async (
            _: unknown,
            { userId }: { userId: string }
        ): Promise<GetUserGroupsWithImagesResponse> => {
            const client = new GroupApiClient();
            const groups = await client.getUserGroups(userId);

            // @ts-expect-error avatar is filtered
            const groupsWithAvatars: GetUserGroupsWithImagesResponse = (
                await Promise.all(
                    groups.map(async (group) => {
                        const { avatarFilePath, ...groupWithoutAvatar } = group;

                        // Download the avatar from the 'group-avatars' bucket
                        const { data, error } = await supabaseClient.storage
                            .from('group-avatars')
                            .download(avatarFilePath ?? '');

                        if (error) {
                            console.error(
                                `Error downloading avatar for group: ${groupWithoutAvatar.id}`,
                                error
                            );
                            // Return group without an avatar if there's an error
                            return {
                                ...groupWithoutAvatar,
                                avatar: undefined,
                            };
                        }

                        // If data exists, convert the Blob to a base64 string
                        if (data) {
                            const base64Avatar = await blobToBase64(data);
                            return {
                                ...groupWithoutAvatar,
                                avatar: base64Avatar,
                            };
                        }

                        // Fallback if no data is returned
                        return { ...groupWithoutAvatar, avatar: undefined };
                    })
                )
            ).filter((group) => group.avatar);

            // eslint-disable-next-line @typescript-eslint/no-unsafe-return
            return groupsWithAvatars;
        },
        fetchChannelMessages: async (
            _: unknown,
            { channelId, offset }: { channelId: string; offset: number }
        ): Promise<GetChannelMessagesResponse> => {
            const client = new GroupApiClient();
            const messages = await client.getChannelMessages(channelId, offset);
            return messages;
        },
        fetchPostComments: async (
            _: unknown,
            {
                postId,
                offset,
                limit,
            }: { postId: string; offset: number; limit: number }
        ): Promise<GetPostCommentsResponse> => {
            const client = new GroupApiClient();
            const comments = await client.getPostComments(
                postId,
                offset,
                limit
            );
            return comments;
        },
    },
    Mutation: {
        createGroup: async (
            _: unknown,
            payload: CreateGroupPayload & { avatar: Promise<File> }
        ): Promise<CreateGroupResponse> => {
            const client = new GroupApiClient();
            const { avatar, ...payloadWithoutAvatar } = payload;
            const group = await client.createGroup(
                payloadWithoutAvatar,
                payload.avatar
            );
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
