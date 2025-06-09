import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    OneToMany,
    JoinColumn,
    CreateDateColumn,
    Index,
} from 'typeorm';
// Use a type‑only import to avoid a runtime dependency cycle.
import type { FeedChannelPostEntity } from './FeedChannelPostEntity';

@Entity('FeedChannelPostComment')
export class FeedChannelPostCommentEntity {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    // The text content of the comment.
    @Column({ type: 'text' })
    content!: string;

    // Automatically record when the comment was posted.
    @CreateDateColumn()
    postedAt!: Date;

    // Whether the comment has been edited.
    @Column({ default: false })
    edited!: boolean;

    // A vote count for the comment.
    @Column({ default: 0 })
    upvotes!: number;

    // The UUID of the user who posted the comment.
    @Column({ type: 'uuid' })
    @Index()
    postedByUserId!: string;

    /**
     * Many comments belong to a single post.
     * When the post is removed, its comments will be deleted as well.
     */
    @ManyToOne('FeedChannelPostEntity', 'comments', { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'postId' })
    post!: FeedChannelPostEntity;

    // Store the post's id.
    @Column({ type: 'uuid' })
    @Index()
    postId!: string;

    /**
     * Self-referencing many-to-one relationship.
     * This represents the parent comment (if any) for threaded discussions.
     * If null, then this comment is a top-level comment.
     */
    @ManyToOne('FeedChannelPostCommentEntity', 'children', {
        nullable: true,
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'parentCommentId' })
    // eslint-disable-next-line no-use-before-define
    parentComment?: FeedChannelPostCommentEntity | null;

    // Optionally store the parent comment's id.
    @Column({ type: 'uuid', nullable: true })
    parentCommentId?: string | null;

    @Column({ type: 'boolean' })
    hasChildren!: boolean;

    /**
     * One comment can have many child comments (i.e. replies).
     */
    @OneToMany('FeedChannelPostCommentEntity', 'parentComment')
    // eslint-disable-next-line no-use-before-define
    children!: FeedChannelPostCommentEntity[];

    @Column({ type: 'jsonb', nullable: true })
    attachmentFilePaths?: string[];
}
