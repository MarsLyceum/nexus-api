import { User } from 'user-api-client';

export type Friend = {
    id: string;
    user: User;
    friend: User;
    status: 'pending' | 'accepted' | 'blocked';
    createdAt: Date;
    updatedAt: Date;
};
