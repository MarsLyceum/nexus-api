import {
    Entity,
    Column,
    OneToMany,
    PrimaryColumn,
    CreateDateColumn,
    Index,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
// Use a type‑only import to avoid runtime dependency cycles.
import type { FeedChannelPostCommentEntity } from './FeedChannelPostCommentEntity';
import type { GroupChannelEntity } from './GroupChannelEntity';

@Entity('FeedChannelPost')
export class FeedChannelPostEntity {
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

    // A title for the post.
    @Column({ length: 200 })
    title!: string;

    // Optional flair text (e.g. "Discussion", "Announcement", etc.)
    @Column({ length: 50, nullable: true })
    flair?: string;

    // For posts linking to external domains (e.g. "store.steampowered.com")
    @Column({ nullable: true })
    domain?: string;

    // A URL for a thumbnail image if available.
    @Column({ nullable: true })
    thumbnail?: string;

    @Column({ default: 0 })
    upvotes!: number;

    @Column({ default: 0 })
    commentsCount!: number;

    @Column({ default: 0 })
    shareCount!: number;

    // Define the one-to-many relationship with comments.
    // Use 'FeedChannelPostCommentEntity' (the actual metadata name) as the target.
    @OneToMany('FeedChannelPostCommentEntity', 'post', {
        cascade: true,
    })
    comments!: FeedChannelPostCommentEntity[];
}
