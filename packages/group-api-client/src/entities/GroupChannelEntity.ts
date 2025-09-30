import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    Index,
} from 'typeorm';
// Use a type-only import for Group.
import type { GroupEntity } from './GroupEntity';

@Entity('GroupChannel')
export class GroupChannelEntity {
    @PrimaryGeneratedColumn('uuid')
    @Index()
    id!: string;

    @Column({ length: 100 })
    name!: string;

    @Column({ type: 'enum', enum: ['text', 'voice', 'feed'] })
    type!: 'text' | 'voice' | 'feed';

    @Column()
    createdAt!: Date;

    // Use a string reference for the relation to Group.
    @ManyToOne('Group', 'channels', { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'groupId' })
    group!: GroupEntity;

    @Column({ type: 'uuid' })
    @Index()
    groupId!: string;

    @Column({ type: 'int', default: 0 })
    orderIndex!: number;
}
