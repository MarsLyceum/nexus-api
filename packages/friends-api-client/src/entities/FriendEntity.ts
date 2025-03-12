import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';

import { UserEntity } from 'user-api-client';

import { Friend } from '../models';

@Entity()
export class FriendEntity implements Friend {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    // The user who holds this friend relationship
    @ManyToOne(() => UserEntity)
    user!: UserEntity;

    // The friend on the other end of this relationship
    @ManyToOne(() => UserEntity)
    friend!: UserEntity;

    @ManyToOne(() => UserEntity)
    requestedBy!: UserEntity;

    @Column({
        type: 'enum',
        enum: ['pending', 'accepted', 'blocked'],
        default: 'pending',
    })
    status!: 'pending' | 'accepted' | 'blocked';

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
