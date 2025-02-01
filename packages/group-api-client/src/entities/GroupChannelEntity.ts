import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
// Use a type-only import for Group.

@Entity('GroupChannel')
export class GroupChannelEntity {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ length: 100 })
    name!: string;

    @Column({ type: 'enum', enum: ['text', 'voice'] })
    type!: 'text' | 'voice';

    @Column()
    createdAt!: Date;

    @Column({ type: 'uuid' })
    groupId!: string;
}
