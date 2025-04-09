import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';

import { Message } from '../models';
import type { ConversationEntity } from './ConversationEntity';

@Entity('Message')
export class MessageEntity implements Message {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'text' })
    content!: string;

    @ManyToOne('Conversation', 'messages', { onDelete: 'CASCADE' })
    conversation!: ConversationEntity;

    @Column({ type: 'uuid' })
    senderUserId!: string;

    @Column({ type: 'timestamptz' })
    createdAt!: Date;

    @Column({ type: 'jsonb', nullable: true })
    attachmentFilePaths?: string[];

    @Column({ default: false })
    edited!: boolean;
}
