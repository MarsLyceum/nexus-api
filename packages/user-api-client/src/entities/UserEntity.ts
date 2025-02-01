import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

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
}
