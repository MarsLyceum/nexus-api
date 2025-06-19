import axios, { AxiosResponse } from 'axios';

import { buildMultipartFormData, isRunningInCloudRun } from 'common-utils';

import {
    CreateGroupPayload,
    UpdateGroupPayload,
    CreateTextChannelMessagePayload,
    CreateFeedChannelPostPayload,
    CreateFeedChannelPostCommentPayload,
    UpdateTextChannelMessagePayload,
    UpdateFeedChannelPostPayload,
} from '../payloads';
import {
    CreateGroupResponse,
    CreateTextChannelMessageResponse,
    GetGroupResponse,
    UpdateGroupResponse,
    GetUserGroupsResponse,
    GetTextChannelMessagesResponse,
    GetPostCommentsResponse,
    GetPostResponse,
    CreatePostCommentResponse,
    CreateFeedChannelPostResponse,
    GetFeedChannelPostsResponse,
    UpdateTextChannelMessageResponse,
    UpdateFeedChannelPostResponse,
} from '../responses';

const useLocalApi = true;

export class GroupApiClient {
    private baseURL =
        isRunningInCloudRun() || !useLocalApi
            ? 'https://group-api-197277044151.us-west1.run.app'
            : 'http://localhost:4002';

    // eslint-disable-next-line class-methods-use-this
    private async query<T>(request: Promise<AxiosResponse<T>>): Promise<T> {
        try {
            const response = await request;
            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                // Handle Axios errors specifically
                console.error('Axios error:', error.message);
                throw error;
            } else {
                // Handle other errors
                console.error('Unexpected error:', error);
                throw new Error('An unexpected error occurred');
            }
        }
    }

    async getGroup(id: string): Promise<GetGroupResponse> {
        return this.query(axios.get(`${this.baseURL}/group/${id}`));
    }

    async getPost(id: string): Promise<GetPostResponse> {
        return this.query(axios.get(`${this.baseURL}/post/${id}`));
    }

    async getUserGroups(userId: string): Promise<GetUserGroupsResponse> {
        return this.query(axios.get(`${this.baseURL}/user-groups/${userId}`));
    }

    async getTextChannelMessages(
        channelId: string,
        offset: number,
        limit: number
    ): Promise<GetTextChannelMessagesResponse> {
        return this.query(
            axios.get(
                `${this.baseURL}/channels/${channelId}/messages?offset=${offset}&limit=${limit}`
            )
        );
    }

    async getFeedChannelPosts(
        channelId: string,
        offset: number,
        limit: number
    ): Promise<GetFeedChannelPostsResponse> {
        return this.query(
            axios.get(
                `${this.baseURL}/channels/${channelId}/posts?offset=${offset}&limit=${limit}`
            )
        );
    }

    async getPostComments(
        postId: string,
        parentCommentId: string,
        offset: number,
        limit: number
    ): Promise<GetPostCommentsResponse> {
        return this.query(
            axios.get(
                `${this.baseURL}/post/${postId}/comments?offset=${offset}&limit=${limit}&parentCommentId=${parentCommentId}`
            )
        );
    }

    async createGroup(
        createGroupPayload: CreateGroupPayload,
        avatar: Promise<File>
    ): Promise<CreateGroupResponse> {
        const formData = await buildMultipartFormData(
            createGroupPayload,
            avatar,
            'avatar'
        );

        return this.query(
            axios.post(`${this.baseURL}/group`, formData, {
                headers: formData.getHeaders(),
            })
        );
    }

    async createTextChannelMessage(
        createTextChannelMessagePayload: CreateTextChannelMessagePayload,
        attachments?: Promise<File>[]
    ): Promise<CreateTextChannelMessageResponse> {
        if (attachments && attachments.length > 0) {
            const formData = await buildMultipartFormData(
                createTextChannelMessagePayload,
                attachments,
                'attachments'
            );

            return this.query(
                axios.post(`${this.baseURL}/text-channel-message`, formData, {
                    headers: formData.getHeaders(),
                })
            );
        }

        return this.query(
            axios.post(
                `${this.baseURL}/text-channel-message`,
                createTextChannelMessagePayload
            )
        );
    }

    async createFeedChannelPost(
        createFeedChannelPostPayload: CreateFeedChannelPostPayload,
        attachments?: Promise<File>[]
    ): Promise<CreateFeedChannelPostResponse> {
        if (attachments && attachments.length > 0) {
            const formData = await buildMultipartFormData(
                createFeedChannelPostPayload,
                attachments,
                'attachments'
            );

            return this.query(
                axios.post(`${this.baseURL}/feed-channel-post`, formData, {
                    headers: formData.getHeaders(),
                })
            );
        }

        return this.query(
            axios.post(
                `${this.baseURL}/feed-channel-post`,
                createFeedChannelPostPayload
            )
        );
    }

    async createPostComment(
        createFeedChannelPostCommentPayload: CreateFeedChannelPostCommentPayload,
        attachments?: Promise<File>[]
    ): Promise<CreatePostCommentResponse> {
        if (attachments && attachments.length > 0) {
            const formData = await buildMultipartFormData(
                createFeedChannelPostCommentPayload,
                attachments,
                'attachments'
            );

            return this.query(
                axios.post(`${this.baseURL}/comment`, formData, {
                    headers: formData.getHeaders(),
                })
            );
        }

        return this.query(
            axios.post(
                `${this.baseURL}/comment`,
                createFeedChannelPostCommentPayload
            )
        );
    }

    async updateGroup(
        id: string,
        data: UpdateGroupPayload
    ): Promise<UpdateGroupResponse> {
        return this.query(axios.put(`${this.baseURL}/group/${id}`, data));
    }

    async updateTextChannelMessage(
        payload: UpdateTextChannelMessagePayload
    ): Promise<UpdateTextChannelMessageResponse> {
        return this.query(
            axios.put(`${this.baseURL}/text-channel-message`, payload)
        );
    }

    async updateFeedChannelPost(
        payload: UpdateFeedChannelPostPayload
    ): Promise<UpdateFeedChannelPostResponse> {
        return this.query(
            axios.put(`${this.baseURL}/feed-channel-post`, payload)
        );
    }

    async deleteGroup(id: string): Promise<undefined> {
        return this.query(axios.delete(`${this.baseURL}/group/${id}`));
    }

    async deleteTextChannelMessage(id: string): Promise<undefined> {
        return this.query(
            axios.delete(`${this.baseURL}/text-channel-message/${id}`)
        );
    }
}
