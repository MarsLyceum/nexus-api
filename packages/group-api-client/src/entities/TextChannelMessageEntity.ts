import {
    Entity,
    PrimaryColumn,
    Column,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
    Index,
} from 'typeorm';
import type { GroupChannelEntity } from './GroupChannelEntity';

@Entity('TextChannelMessage')
export class TextChannelMessageEntity {
    @PrimaryColumn('uuid')
    id!: string;

    // All messages have content, postedAt, and an author.
    @Column({ type: 'text' })
    content!: string;

    @CreateDateColumn()
    @Index()
    postedAt!: Date;

    @Column({ default: false })
    edited!: boolean;

    // Reference to the channel where this message was posted.
    @ManyToOne('GroupChannel', { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'channelId' })
    channel!: GroupChannelEntity;

    @Column({ type: 'uuid' })
    @Index()
    channelId!: string;

    // The user who posted this message.
    @Column({ type: 'uuid' })
    postedByUserId!: string;

    @Column({ type: 'jsonb', nullable: true })
    attachmentFilePaths?: string[];
}
