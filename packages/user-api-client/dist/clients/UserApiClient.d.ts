import { CreateUserPayload } from '../payloads';
export declare class UserApiClient {
    private baseURL;
    private query;
    getUser(id: number): Promise<unknown>;
    getUserByEmail(email: string): Promise<unknown>;
    createUser(createUserPayload: CreateUserPayload): Promise<unknown>;
    updateUser(id: number, data: any): Promise<unknown>;
    deleteUser(id: number): Promise<unknown>;
}
