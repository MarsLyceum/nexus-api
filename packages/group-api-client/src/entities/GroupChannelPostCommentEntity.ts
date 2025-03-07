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
import type { GroupChannelPostEntity } from './GroupChannelPostEntity';

@Entity('GroupChannelPostComment')
export class GroupChannelPostCommentEntity {
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
    @ManyToOne('GroupChannelPostEntity', 'comments', { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'postId' })
    post!: GroupChannelPostEntity;

    // Store the post's id.
    @Column({ type: 'uuid' })
    @Index()
    postId!: string;

    /**
     * Self-referencing many-to-one relationship.
     * This represents the parent comment (if any) for threaded discussions.
     * If null, then this comment is a top-level comment.
     */
    @ManyToOne('GroupChannelPostCommentEntity', 'children', {
        nullable: true,
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'parentCommentId' })
    parentComment?: GroupChannelPostCommentEntity | null;

    // Optionally store the parent comment's id.
    @Column({ type: 'uuid', nullable: true })
    parentCommentId?: string | null;

    @Column({ type: 'boolean' })
    hasChildren!: boolean;

    /**
     * One comment can have many child comments (i.e. replies).
     */
    @OneToMany('GroupChannelPostCommentEntity', 'parentComment')
    children!: GroupChannelPostCommentEntity[];
}
