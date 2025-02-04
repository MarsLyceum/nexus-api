import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
    TableInheritance,
} from 'typeorm';
import type { GroupChannelEntity } from './GroupChannelEntity';

@Entity('GroupChannelMessage')
@TableInheritance({ column: { type: 'varchar', name: 'messageType' } })
export class GroupChannelMessageEntity {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    // All messages have content, postedAt, and an author.
    @Column({ type: 'text' })
    content!: string;

    @CreateDateColumn()
    postedAt!: Date;

    @Column({ default: false })
    edited!: boolean;

    // Reference to the channel where this message was posted.
    @ManyToOne('GroupChannel', 'messages', { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'channelId' })
    channel!: GroupChannelEntity;

    @Column({ type: 'uuid' })
    channelId!: string;

    // The user who posted this message.
    @Column({ type: 'uuid' })
    postedByUserId!: string;
}
