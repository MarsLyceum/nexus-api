import axios, { AxiosResponse } from 'axios';

import { CreateUserPayload, UpdateUserPayload } from '../payloads';

export class UserApiClient {
    private baseURL = 'https://user-api-iwesf7iypq-uw.a.run.app';

    // eslint-disable-next-line class-methods-use-this
    private async query<T, K extends AxiosResponse<T, unknown>>(
        request: Promise<K>
    ): Promise<T> {
        try {
            const response = await request;
            return response.data;
        } catch (error) {
            // Handle error centrally
            console.error('User API error:', error);
            throw error;
        }
    }

    // Get a single user by ID
    async getUser(email: string) {
        return this.query(axios.get(`${this.baseURL}/user/${email}`));
    }

    // Create a new user
    async createUser(createUserPayload: CreateUserPayload) {
        return this.query(axios.post(this.baseURL, createUserPayload));
    }

    // Update a user
    async updateUser(email: string, data: UpdateUserPayload) {
        return this.query(axios.put(`${this.baseURL}/${email}`, data));
    }

    // Delete a user
    async deleteUser(email: string) {
        return this.query(axios.delete(`${this.baseURL}/${email}`));
    }
}
