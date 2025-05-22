import axios, { AxiosResponse } from 'axios';

import { buildMultipartFormData, isRunningInCloudRun } from 'common-utils';

import {
    CreateGroupPayload,
    UpdateGroupPayload,
    CreateGroupChannelMessagePayload,
    CreateGroupChannelPostCommentPayload,
} from '../payloads';
import {
    CreateGroupResponse,
    CreateGroupChannelMessageResponse,
    GetGroupResponse,
    UpdateGroupResponse,
    GetUserGroupsResponse,
    GetChannelMessagesResponse,
    GetPostCommentsResponse,
    GetPostResponse,
    CreatePostCommentResponse,
} from '../responses';

const useLocalApi = false;

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

    async getChannelMessages(
        channelId: string,
        offset: number,
        limit: number
    ): Promise<GetChannelMessagesResponse> {
        return this.query(
            axios.get(
                `${this.baseURL}/channels/${channelId}/messages?offset=${offset}&limit=${limit}`
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

    async createGroupChannelMessage(
        createGroupChannelMessagePayload: CreateGroupChannelMessagePayload,
        attachments?: Promise<File>[]
    ): Promise<CreateGroupChannelMessageResponse> {
        if (attachments && attachments.length > 0) {
            const formData = await buildMultipartFormData(
                createGroupChannelMessagePayload,
                attachments,
                'attachments'
            );

            return this.query(
                axios.post(`${this.baseURL}/group-channel-message`, formData, {
                    headers: formData.getHeaders(),
                })
            );
        }

        return this.query(
            axios.post(
                `${this.baseURL}/group-channel-message`,
                createGroupChannelMessagePayload
            )
        );
    }

    async createPostComment(
        createGroupChannelPostCommentPayload: CreateGroupChannelPostCommentPayload,
        attachments?: Promise<File>[]
    ): Promise<CreatePostCommentResponse> {
        if (attachments && attachments.length > 0) {
            const formData = await buildMultipartFormData(
                createGroupChannelPostCommentPayload,
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
                createGroupChannelPostCommentPayload
            )
        );
    }

    async updateGroup(
        id: string,
        data: UpdateGroupPayload
    ): Promise<UpdateGroupResponse> {
        return this.query(axios.put(`${this.baseURL}/${id}`, data));
    }

    async deleteGroup(id: string): Promise<undefined> {
        return this.query(axios.delete(`${this.baseURL}/${id}`));
    }
}
