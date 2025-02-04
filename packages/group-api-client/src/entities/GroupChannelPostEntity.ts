import { ChildEntity, Column, OneToMany } from 'typeorm';
import { GroupChannelMessageEntity } from './GroupChannelMessageEntity';
// Use a type‑only import to avoid runtime dependency cycles.
import type { GroupChannelPostCommentEntity } from './GroupChannelPostCommentEntity';

@ChildEntity('post')
export class GroupChannelPostEntity extends GroupChannelMessageEntity {
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
    // Use 'GroupChannelPostCommentEntity' (the actual metadata name) as the target.
    @OneToMany('GroupChannelPostCommentEntity', 'post', {
        cascade: true,
    })
    comments!: GroupChannelPostCommentEntity[];
}
