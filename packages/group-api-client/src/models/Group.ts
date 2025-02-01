export type GroupRole = 'owner' | 'admin' | 'moderator' | 'member';

export type GroupMember = {
    userEmail: string;
    groupId: string;
    role: GroupRole;
    joinedAt: Date;
    group: Group;
};

export type GroupChannel = {
    id: string;
    name: string;
    type: 'text' | 'voice';
    createdAt: Date;
    group: Group;
};

export type Group = {
    id: string;
    name: string;
    createdByUserEmail: string;
    createdAt: Date;
    members: GroupMember[];
    channels: GroupChannel[];
    description?: string;
};
