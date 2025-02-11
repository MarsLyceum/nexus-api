import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
// Use type-only imports to avoid runtime dependency cycles.
import { GroupMemberEntity } from './GroupMemberEntity';
import type { GroupChannelEntity } from './GroupChannelEntity';

@Entity('Group')
export class GroupEntity {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ length: 100 })
    name!: string;

    // Store the creator's email.
    @Column({ type: 'uuid' })
    createdByUserId!: string;

    @Column()
    createdAt!: Date;

    @Column({ type: 'text', nullable: true })
    description?: string;

    // Use a string reference for the relation target.
    @OneToMany('GroupMember', 'group', { cascade: true })
    members!: GroupMemberEntity[];

    @OneToMany('GroupChannel', 'group', { cascade: true })
    channels!: GroupChannelEntity[];

    @Column({ length: 100, nullable: true })
    avatarFilePath?: string;

    @Column({ type: 'boolean', default: false })
    publicGroup!: boolean;
}
