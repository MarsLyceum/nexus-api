import axios, { AxiosResponse } from 'axios';

import { buildMultipartFormData, isRunningInCloudRun } from 'common-utils';

import {
    CreateConversationPayload,
    SendMessagePayload,
    UpdateMessagePayload,
} from '../payloads';
import {
    GetConversationsResponse,
    GetConversationMessagesResponse,
    CreateConversationResponse,
    SendMessageResponse,
    UpdateMessageResponse,
} from '../responses';

const useLocalApi = true;

export class DirectMessagingApiClient {
    private baseURL =
        isRunningInCloudRun() || !useLocalApi
            ? 'https://direct-messaging-api-197277044151.us-west1.run.app'
            : 'http://localhost:4004';

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

    async getConversationMessages(
        conversationId: string,
        offset: number,
        limit: number
    ): Promise<GetConversationMessagesResponse> {
        return this.query(
            axios.get(
                `${this.baseURL}/conversation/${conversationId}?offset=${offset}&limit=${limit}`
            )
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
        sendMessagePayload: SendMessagePayload,
        attachments?: Promise<File>[]
    ): Promise<SendMessageResponse> {
        if (attachments && attachments.length > 0) {
            const formData = await buildMultipartFormData(
                sendMessagePayload,
                attachments,
                'attachments'
            );

            return this.query(
                axios.post(
                    `${this.baseURL}/conversation/${conversationId}/message`,
                    formData,
                    {
                        headers: formData.getHeaders(),
                    }
                )
            );
        }

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
