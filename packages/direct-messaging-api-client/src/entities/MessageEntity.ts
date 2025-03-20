import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    CreateDateColumn,
} from 'typeorm';

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

    @CreateDateColumn()
    createdAt!: Date;

    @Column({ type: 'jsonb', nullable: true })
    attachmentFilePaths?: string[];

    @Column({ default: false })
    edited!: boolean;
}
