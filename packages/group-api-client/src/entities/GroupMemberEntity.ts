import {
    Entity,
    Column,
    PrimaryColumn,
    ManyToOne,
    JoinColumn,
    Index,
} from 'typeorm';
import type { GroupEntity } from './GroupEntity';
import { GroupRole } from '../models';

@Entity('GroupMember')
export class GroupMemberEntity {
    // Use the user's email as one part of the composite primary key.
    @PrimaryColumn({ type: 'uuid' })
    @Index()
    userId!: string;

    // Use the group's id as the other part of the composite primary key.
    // We assume that GroupEntity has an id of type UUID.
    @PrimaryColumn({ type: 'uuid' })
    groupId!: string;

    @Column({ type: 'enum', enum: ['owner', 'admin', 'moderator', 'member'] })
    role!: GroupRole;

    @Column({ type: 'timestamp' })
    joinedAt!: Date;

    // Define the many-to-one relationship with Group.
    // Note that we use a string reference ('Group') so that we avoid runtime cycles.
    @ManyToOne('Group', 'members', { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'groupId' })
    group!: GroupEntity;
}
