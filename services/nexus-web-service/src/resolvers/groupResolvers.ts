import { withFilter } from 'graphql-subscriptions';

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
    GetPostCommentsResponseWithAttachmentUrls,
    CreatePostCommentResponse,
} from 'group-api-client';
import {
    fetchAttachmentsForMessage,
    getCachedSignedUrl,
    fetchAttachmentsForCommentsRecursive,
} from '../utils';

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
                            attachmentFilePaths.map(
                                async (attachmentFilePath) =>
                                    getCachedSignedUrl(
                                        'message-attachments',
                                        attachmentFilePath
                                    )
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
                            const avatarUrl = await getCachedSignedUrl(
                                'group-avatars',
                                avatarFilePath
                            );

                            return {
                                ...groupWithoutAvatar,
                                avatarUrl,
                            };
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
                {
                    channelId,
                    offset,
                    limit,
                }: { channelId: string; offset: number; limit: number }
            ): Promise<GetChannelMessagesResponseWithAttachmentUrls> => {
                const client = new GroupApiClient();
                const messages = await client.getChannelMessages(
                    channelId,
                    offset,
                    limit
                );

                const messagesWithAttachments: GetChannelMessagesResponseWithAttachmentUrls =
                    await Promise.all(
                        messages.map((element) =>
                            fetchAttachmentsForMessage(element)
                        )
                    );

                return messagesWithAttachments;
            },
            fetchPostComments: async (
                _: unknown,
                {
                    postId,
                    parentCommentId,
                    offset,
                    limit,
                }: {
                    postId: string;
                    parentCommentId?: string;
                    offset?: number;
                    limit?: number;
                }
            ): Promise<GetPostCommentsResponse> => {
                const client = new GroupApiClient();
                const comments = await client.getPostComments(
                    postId,
                    parentCommentId ?? '',
                    offset ?? 0,
                    limit ?? 50
                );

                const commentsWithAttachments: GetPostCommentsResponseWithAttachmentUrls =
                    await Promise.all(
                        comments.map((element) =>
                            fetchAttachmentsForCommentsRecursive(element)
                        )
                    );

                return commentsWithAttachments;
            },
        },
        Mutation: {
            createGroup: async (
                _: unknown,
                // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
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
                // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
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
                // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
                payload: CreateGroupChannelPostCommentPayload & {
                    attachments?: Promise<File>[];
                }
            ): Promise<CreatePostCommentResponse> => {
                const client = new GroupApiClient();

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

            // eslint-disable-next-line @typescript-eslint/require-await
            deleteGroup: async (
                _: unknown,
                { id }: { id: string }
            ): Promise<undefined> => {
                const client = new GroupApiClient();
                // eslint-disable-next-line @typescript-eslint/no-unsafe-return
                return client.deleteGroup(id);
            },
        },
        Subscription: {
            messageAdded: {
                subscribe: withFilter(
                    (_, __, context) =>
                        context.pubsub.asyncIterableIterator('MESSAGE_ADDED'),
                    (payload, variables) =>
                        // Only forward the event if the channelIds match
                        payload.messageAdded.channelId === variables.channelId
                ),
            },
        },
        // __resolveType on the GroupChannelMessage interface
        GroupChannelMessage: {
            // eslint-disable-next-line no-underscore-dangle, @typescript-eslint/no-explicit-any
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
