import axios, { AxiosResponse } from 'axios';

import {
    CreateConversationPayload,
    SendMessagePayload,
    UpdateMessagePayload,
} from '../payloads';
import {
    GetConversationsResponse,
    GetConversationResponse,
    CreateConversationResponse,
    SendMessageResponse,
    UpdateMessageResponse,
} from '../responses';

export class DirectMessagingApiClient {
    // private baseURL = 'https://friends-api-197277044151.us-west1.run.app';

    private baseURL = 'http://localhost:4004';

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

    async getConversations(userId: string): Promise<GetConversationsResponse> {
        return this.query(axios.get(`${this.baseURL}/conversations/${userId}`));
    }

    async getConversation(
        conversationId: string
    ): Promise<GetConversationResponse> {
        return this.query(
            axios.get(`${this.baseURL}/conversation/${conversationId}`)
        );
    }

    async createConversation(
        createConversationPayload: CreateConversationPayload
    ): Promise<CreateConversationResponse> {
        return this.query(
            axios.post(
                `${this.baseURL}/conversation`,
                createConversationPayload
            )
        );
    }

    async sendMessage(
        conversationId: string,
        sendMessagePayload: SendMessagePayload
    ): Promise<SendMessageResponse> {
        return this.query(
            axios.post(
                `${this.baseURL}/conversation/${conversationId}/message`,
                sendMessagePayload
            )
        );
    }

    async updateMessage(
        conversationId: string,
        updateMessagePayload: UpdateMessagePayload
    ): Promise<UpdateMessageResponse> {
        return this.query(
            axios.put(
                `${this.baseURL}/conversation/${conversationId}/message`,
                updateMessagePayload
            )
        );
    }

    async deleteMessage(messageId: string): Promise<undefined> {
        return this.query(axios.delete(`${this.baseURL}/message/${messageId}`));
    }
}
