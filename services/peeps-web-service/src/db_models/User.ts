import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ length: 100 })
    email!: string;

    @Column({ length: 50 })
    firstName!: string;

    @Column({ length: 50 })
    lastName!: string;

    @Column({ length: 20 })
    phoneNumber!: string;

    // Uncomment the following line if age should be an optional field
    // @Column({ nullable: true })
    // age!: number;
}
