import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    email!: string;

    @Column()
    hashedPassword!: string;

    @Column({ nullable: true })
    firstName!: string;

    @Column({ nullable: true })
    lastName!: string;

    @Column({ nullable: true })
    age!: number;
}
