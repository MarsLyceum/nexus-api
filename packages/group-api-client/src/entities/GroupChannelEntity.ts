import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    OneToMany,
    JoinColumn,
} from 'typeorm';
// Use a type-only import for Group.
import type { GroupEntity } from './GroupEntity';
import type { GroupChannelMessageEntity } from './GroupChannelMessageEntity';

@Entity('GroupChannel')
export class GroupChannelEntity {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ length: 100 })
    name!: string;

    @Column({ type: 'enum', enum: ['text', 'voice'] })
    type!: 'text' | 'voice';

    @Column()
    createdAt!: Date;

    // Use a string reference for the relation to Group.
    @ManyToOne('Group', 'channels', { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'groupId' })
    group!: GroupEntity;

    @Column({ type: 'uuid' })
    groupId!: string;

    @OneToMany('GroupChannelMessage', 'channel', { cascade: true })
    messages!: GroupChannelMessageEntity[];
}
