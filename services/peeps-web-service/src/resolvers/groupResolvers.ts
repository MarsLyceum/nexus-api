import { createClient } from '@supabase/supabase-js';
import {
    GroupApiClient,
    CreateGroupPayload,
    UpdateGroupPayload,
    CreateGroupResponse,
    GetGroupResponse,
    GetUserGroupsWithImagesResponse,
    GetChannelMessagesResponseWithAttachmentUrls,
    UpdateGroupResponse,
    CreateGroupChannelMessagePayload,
    CreateGroupChannelMessageResponse,
    GetPostCommentsResponse,
    GetPostResponseWithAttachmentUrls,
    CreateGroupChannelPostCommentPayload,
    CreatePostCommentResponse,
} from 'group-api-client';

import { SUPABASE_SERVICE_KEY, SUPABASE_URL } from '../config';

const supabaseUrl = SUPABASE_URL!;
const supabaseServiceKey = SUPABASE_SERVICE_KEY!;
const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

export const loadGroupResolvers = async () => {
    const { default: GraphQLUpload } = await import(
        'graphql-upload/GraphQLUpload.mjs'
    );

    return {
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
            ): Promise<GetPostResponseWithAttachmentUrls> => {
                const client = new GroupApiClient();
                const post = await client.getPost(id);

                const getPostWithAttachments: () => Promise<GetPostResponseWithAttachmentUrls> =
                    async () => {
                        const {
                            attachmentFilePaths,
                            ...messageWithoutFilePaths
                        } = post;

                        if (!attachmentFilePaths) {
                            return {
                                ...messageWithoutFilePaths,
                                attachmentUrls: [],
                            };
                        }

                        const attachmentUrls = await Promise.all(
                            (attachmentFilePaths as string[]).map(
                                async (attachmentFilePath) => {
                                    const { data, error } =
                                        await supabaseClient.storage
                                            .from('message-attachments')
                                            .createSignedUrl(
                                                attachmentFilePath,
                                                60 * 60 // one hour
                                            );

                                    return data?.signedUrl ?? '';
                                }
                            )
                        );

                        // Fallback if no data is returned
                        return {
                            ...messageWithoutFilePaths,
                            attachmentUrls,
                        };
                    };
                // eslint-disable-next-line @typescript-eslint/no-unsafe-return
                return getPostWithAttachments();
            },
            fetchUserGroups: async (
                _: unknown,
                { userId }: { userId: string }
            ): Promise<GetUserGroupsWithImagesResponse> => {
                const client = new GroupApiClient();
                const groups = await client.getUserGroups(userId);

                const groupsWithAvatars: GetUserGroupsWithImagesResponse = (
                    await Promise.all(
                        groups.map(async (group) => {
                            const { avatarFilePath, ...groupWithoutAvatar } =
                                group;

                            // If there's no avatar file path, return the group without an avatar.
                            if (!avatarFilePath) {
                                return {
                                    ...groupWithoutAvatar,
                                    avatarUrl: '',
                                };
                            }

                            // Generate a signed URL for the avatar from the 'group-avatars' bucket, valid for 60 seconds.
                            const { data, error } = await supabaseClient.storage
                                .from('group-avatars')
                                .createSignedUrl(avatarFilePath, 60 * 60);

                            if (error) {
                                console.error(
                                    `Error generating signed URL for group: ${groupWithoutAvatar.id}`,
                                    error
                                );
                                return {
                                    ...groupWithoutAvatar,
                                    avatarUrl: '',
                                };
                            }

                            if (data) {
                                return {
                                    ...groupWithoutAvatar,
                                    avatarUrl: data.signedUrl,
                                };
                            }

                            // Fallback if no data is returned
                            return { ...groupWithoutAvatar, avatarUrl: '' };
                        })
                    )
                )
                    // eslint-disable-next-line unicorn/no-await-expression-member
                    .filter((group) => group.avatarUrl);

                // eslint-disable-next-line @typescript-eslint/no-unsafe-return
                return groupsWithAvatars;
            },
            fetchChannelMessages: async (
                _: unknown,
                { channelId, offset }: { channelId: string; offset: number }
            ): Promise<GetChannelMessagesResponseWithAttachmentUrls> => {
                const client = new GroupApiClient();
                const messages = await client.getChannelMessages(
                    channelId,
                    offset
                );

                const messagesWithAttachments: GetChannelMessagesResponseWithAttachmentUrls =
                    await Promise.all(
                        messages.map(async (message) => {
                            const {
                                attachmentFilePaths,
                                ...messageWithoutFilePaths
                            } = message;

                            if (!attachmentFilePaths) {
                                return {
                                    ...messageWithoutFilePaths,
                                    attachmentUrls: [],
                                };
                            }

                            const attachmentUrls = await Promise.all(
                                (attachmentFilePaths as string[]).map(
                                    async (attachmentFilePath) => {
                                        const { data, error } =
                                            await supabaseClient.storage
                                                .from('message-attachments')
                                                .createSignedUrl(
                                                    attachmentFilePath,
                                                    60 * 60
                                                );

                                        return data?.signedUrl ?? '';
                                    }
                                )
                            );

                            // Fallback if no data is returned
                            return {
                                ...messageWithoutFilePaths,
                                attachmentUrls,
                            };
                        })
                    );

                return messagesWithAttachments;
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
                payload: CreateGroupChannelMessagePayload & {
                    attachments?: Promise<File>[];
                }
            ): Promise<CreateGroupChannelMessageResponse> => {
                const client = new GroupApiClient();

                const { attachments = [] } = payload;

                const message = await client.createGroupChannelMessage(
                    payload,
                    attachments
                );
                return message;
            },

            createPostComment: async (
                _: unknown,
                payload: CreateGroupChannelPostCommentPayload & {
                    attachments?: Promise<File>[];
                }
            ): Promise<CreatePostCommentResponse> => {
                const client = new GroupApiClient();

                console.log('in createPostComment payload:', payload);

                const { attachments = [] } = payload;

                const comment = await client.createPostComment(
                    payload,
                    attachments
                );
                return comment;
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
                    Object.prototype.hasOwnProperty.call(
                        obj,
                        'commentsCount'
                    ) ||
                    Object.prototype.hasOwnProperty.call(obj, 'shareCount')
                ) {
                    return 'PostMessage';
                }
                return 'RegularMessage';
            },
        },
    };
};
