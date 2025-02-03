import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
// Use a type-only import for Group.
import type { GroupChannelEntity } from './GroupChannelEntity';

@Entity('GroupChannelMessage')
export class GroupChannelMessageEntity {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'text' })
    content!: string;

    @Column()
    postedAt!: Date;

    @Column()
    edited!: boolean;

    @ManyToOne('GroupChannel', 'messages', { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'channelId' })
    channel!: GroupChannelEntity;

    @Column({ type: 'uuid' })
    channelId!: string;

    @Column({ type: 'uuid' })
    postedByUserId!: string;
}
