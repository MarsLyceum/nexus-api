import axios, { AxiosResponse } from 'axios';

import { CreateGroupPayload, UpdateGroupPayload } from '../payloads';
import {
    CreateGroupResponse,
    GetGroupResponse,
    UpdateGroupResponse,
    GetUserGroupsResponse,
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

    async getUserGroups(email: string): Promise<GetUserGroupsResponse> {
        return this.query(axios.get(`${this.baseURL}/user-groups/${email}`));
    }

    async createGroup(
        createGroupPayload: CreateGroupPayload
    ): Promise<CreateGroupResponse> {
        return this.query(axios.post(this.baseURL, createGroupPayload));
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
