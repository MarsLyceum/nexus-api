import axios, { AxiosResponse } from 'axios';
import FormData from 'form-data';

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
    GetPostResponse,
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

    async getPost(id: string): Promise<GetPostResponse> {
        return this.query(axios.get(`${this.baseURL}/post/${id}`));
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
        createGroupPayload: CreateGroupPayload,
        avatar: Promise<File>
    ): Promise<CreateGroupResponse> {
        const formData = new FormData();

        // Append all payload fields to the form data
        Object.entries(createGroupPayload).forEach(([key, value]) => {
            // If your payload values aren’t strings, you may need to convert them
            formData.append(key, String(value as any));
        });

        const resolvedAvatar = await avatar;

        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
        if (typeof (resolvedAvatar as any).createReadStream === 'function') {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
            const stream = (resolvedAvatar as any).createReadStream();
            formData.append('avatar', stream, {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
                filename:
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
                    (resolvedAvatar as any).filename || `${Date.now()}.jpg`,
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
                contentType: (resolvedAvatar as any).mimetype || 'image/jpeg',
            });
        } else {
            // Otherwise, assume avatar is already a browser File or compatible object.
            formData.append('avatar', resolvedAvatar);
        }

        return this.query(
            axios.post(`${this.baseURL}/group`, formData, {
                headers: formData.getHeaders
                    ? formData.getHeaders()
                    : { 'Content-Type': 'multipart/form-data' },
            })
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
