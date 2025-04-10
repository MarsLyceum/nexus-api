import axios, { AxiosResponse } from 'axios';

import { isRunningInCloudRun } from 'common-utils';

import { SendFriendRequestPayload } from '../payloads';
import {
    SendFriendRequestResponse,
    AcceptFriendRequestResponse,
    GetFriendsResponse,
} from '../responses';

const useLocalApi = false;

export class FriendsApiClient {
    private baseURL =
        isRunningInCloudRun() || !useLocalApi
            ? 'https://friends-api-197277044151.us-west1.run.app'
            : 'http://localhost:4003';

    // private baseURL = 'http://localhost:4003';

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

    async getFriends(userId: string): Promise<GetFriendsResponse> {
        return this.query(axios.get(`${this.baseURL}/friends/${userId}`));
    }

    async sendFriendRequest(
        sendFriendRequestPayload: SendFriendRequestPayload
    ): Promise<SendFriendRequestResponse> {
        return this.query(
            axios.post(
                `${this.baseURL}/friend-request`,
                sendFriendRequestPayload
            )
        );
    }

    async acceptFriendRequest(
        friendId: string
    ): Promise<AcceptFriendRequestResponse> {
        return this.query(
            axios.patch(`${this.baseURL}/friend-request/${friendId}`)
        );
    }

    async removeFriend(friendId: string): Promise<undefined> {
        return this.query(axios.delete(`${this.baseURL}/friend/${friendId}`));
    }
}
