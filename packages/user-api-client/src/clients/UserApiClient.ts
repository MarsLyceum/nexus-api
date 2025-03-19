import axios, { AxiosResponse } from 'axios';

import { CreateUserPayload, UpdateUserPayload } from '../payloads';
import {
    CreateUserResponse,
    GetUserResponse,
    UpdateUserResponse,
    SearchForUsersResponse,
} from '../responses';

export class UserApiClient {
    private baseURL = 'https://user-api-iwesf7iypq-uw.a.run.app';

    // private baseURL = 'http://localhost:4001';

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

    async getUser(userId: string): Promise<GetUserResponse> {
        return this.query(axios.get(`${this.baseURL}/user/${userId}`));
    }

    async getUserByEmail(email: string): Promise<GetUserResponse> {
        return this.query(axios.get(`${this.baseURL}/user-by-email/${email}`));
    }

    async searchForUsers(searchQuery: string): Promise<SearchForUsersResponse> {
        return this.query(axios.get(`${this.baseURL}/search/${searchQuery}`));
    }

    // Create a new user
    async createUser(
        createUserPayload: CreateUserPayload
    ): Promise<CreateUserResponse> {
        return this.query(
            axios.post(`${this.baseURL}/user`, createUserPayload)
        );
    }

    // Update a user
    async updateUser(
        userId: string,
        data: UpdateUserPayload
    ): Promise<UpdateUserResponse> {
        return this.query(axios.put(`${this.baseURL}/${userId}`, data));
    }

    // Delete a user
    async deleteUser(userId: string): Promise<undefined> {
        return this.query(axios.delete(`${this.baseURL}/${userId}`));
    }
}
