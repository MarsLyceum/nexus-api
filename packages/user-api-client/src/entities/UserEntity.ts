import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToMany,
    JoinTable,
} from 'typeorm';
import { GroupEntity } from 'group-api-client';

@Entity()
export class User {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    // Ensure email is unique so that it can be used reliably as a join column.
    @Column({ length: 100, unique: true })
    email!: string;

    @Column({ length: 50 })
    firstName!: string;

    @Column({ length: 50 })
    lastName!: string;

    @Column({ length: 20 })
    phoneNumber!: string;

    /**
     * A unidirectional many-to-many association that lets you query the groups
     * that this user is a member of. It uses the existing "group_member" table
     * as a join table. In that table:
     *
     * - The `userEmail` column refers to this user's `email` field.
     * - The `groupId` column refers to the Group entity’s `id` field.
     *
     * Because the group-api-client already maps the "group_member" table as an
     * entity (to hold additional information such as role and joinedAt), this
     * ManyToMany relation is read-only and meant for convenience.
     */
    @ManyToMany(() => GroupEntity, { eager: false })
    @JoinTable({
        name: 'GroupMember',
        joinColumn: {
            name: 'userEmail',
            referencedColumnName: 'email',
        },
        inverseJoinColumn: {
            name: 'groupId',
            referencedColumnName: 'id',
        },
    })
    groups!: GroupEntity[];
}
