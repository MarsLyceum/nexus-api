import { Entity, Column, PrimaryColumn } from 'typeorm';
import { GroupRole } from '../models';

@Entity('GroupMember')
export class GroupMemberEntity {
    // Use the user's email as one part of the composite primary key.
    @PrimaryColumn({ type: 'varchar', length: 100 })
    userEmail!: string;

    // Use the group's id as the other part of the composite primary key.
    // We assume that GroupEntity has an id of type UUID.
    @PrimaryColumn({ type: 'uuid' })
    groupId!: string;

    @Column({ type: 'enum', enum: ['owner', 'admin', 'moderator', 'member'] })
    role!: GroupRole;

    @Column({ type: 'timestamp' })
    joinedAt!: Date;
}
