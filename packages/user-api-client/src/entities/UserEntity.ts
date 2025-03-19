import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

import { User } from '../models';

@Entity()
export class UserEntity implements User {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    // Ensure email is unique so that it can be used reliably as a join column.
    @Column({ length: 100, unique: true })
    email!: string;

    @Column({ length: 100, unique: true })
    username!: string;

    @Column({ length: 50 })
    firstName!: string;

    @Column({ length: 50 })
    lastName!: string;

    @Column({ length: 20 })
    phoneNumber!: string;

    @Column({
        type: 'enum',
        enum: [
            'online',
            'offline',
            'idle',
            'invisible',
            'offline_dnd',
            'online_dnd',
        ],
        default: 'offline',
    })
    status!:
        | 'online'
        | 'offline'
        | 'idle'
        | 'invisible'
        | 'offline_dnd'
        | 'online_dnd';
}
