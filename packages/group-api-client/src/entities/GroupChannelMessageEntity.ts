import {
    Entity,
    PrimaryColumn,
    Column,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
    TableInheritance,
    Index,
    ManyToMany,
    JoinTable,
} from 'typeorm';
import type { GroupChannelEntity } from './GroupChannelEntity';

@Index('idx_message_channel_postedat', ['channelId', 'postedAt'])
@Entity('GroupChannelMessage')
@TableInheritance({ column: { type: 'varchar', name: 'messageType' } })
export class GroupChannelMessageEntity {
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
    @ManyToOne('GroupChannel', 'messages', { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'channelId' })
    channel!: GroupChannelEntity;

    @Column({ type: 'uuid' })
    @Index()
    channelId!: string;

    // The user who posted this message.
    @Column({ type: 'uuid' })
    postedByUserId!: string;

    // Expose the discriminator column as a property so that it gets returned in queries.
    @Column({ name: 'messageType', type: 'varchar', nullable: false })
    messageType!: string;

    @Column({ type: 'jsonb', nullable: true })
    attachmentFilePaths?: string[];
}
