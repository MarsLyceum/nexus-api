import axios, { AxiosResponse } from 'axios';

import { getCorrelationId } from 'common-middleware';

import {
    CreateGroupPayload,
    UpdateGroupPayload,
    CreateGroupChannelMessagePayload,
} from '../payloads';
import {
    CreateGroupResponse,
    CreateGroupChannelMessageResponse,
    GetGroupResponse,
    UpdateGroupResponse,
    GetUserGroupsResponse,
    GetChannelMessagesResponse,
    GetPostCommentsResponse,
} from '../responses';

export class GroupApiClient {
    private baseURL = 'https://group-api-197277044151.us-west1.run.app';

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

    async getUserGroups(userId: string): Promise<GetUserGroupsResponse> {
        return this.query(axios.get(`${this.baseURL}/user-groups/${userId}`));
    }

    async getChannelMessages(
        channelId: string,
        offset: number
    ): Promise<GetChannelMessagesResponse> {
        return this.query(
            axios.get(
                `${this.baseURL}/channels/${channelId}/messages?offset=${offset}`
            )
        );
    }

    async getPostComments(
        postId: string,
        offset: number,
        limit: number
    ): Promise<GetPostCommentsResponse> {
        return this.query(
            axios.get(
                `${this.baseURL}/post/${postId}/comments?offset=${offset}&limit=${limit}`
            )
        );
    }

    async createGroup(
        createGroupPayload: CreateGroupPayload
    ): Promise<CreateGroupResponse> {
        return this.query(
            axios.post(`${this.baseURL}/group`, createGroupPayload)
        );
    }

    async createGroupChannelMessage(
        createGroupChannelMessagePayload: CreateGroupChannelMessagePayload
    ): Promise<CreateGroupChannelMessageResponse> {
        return this.query(
            axios.post(
                `${this.baseURL}/group-channel-message`,
                createGroupChannelMessagePayload
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
