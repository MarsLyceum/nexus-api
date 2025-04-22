import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';

import { Conversation } from '../models';
import type { MessageEntity } from './MessageEntity';

@Entity('Conversation')
export class ConversationEntity implements Conversation {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({
        type: 'enum',
        enum: ['direct', 'group', 'moderator'],
        default: 'direct',
    })
    type!: 'direct' | 'group' | 'moderator';

    @Column({ type: 'uuid', array: true })
    participantsUserIds!: string[];

    @Column({ type: 'uuid', array: true, default: () => "'{}'" })
    closedByUserIds!: string[];

    // Messages within the conversation.
    @OneToMany('Message', 'conversation', { cascade: true })
    messages!: MessageEntity[];

    @Column({ type: 'uuid', nullable: true })
    channelId!: string | null;
}
