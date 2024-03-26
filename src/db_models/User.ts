import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity()
export class User {
  constructor(
    email: string,
    hashedPassword: string,
    firstName?: string,
    lastName?: string,
    age?: number
  ) {
    this.email = email;
    this.hashedPassword = hashedPassword;
    this.firstName = firstName ?? "";
    this.lastName = lastName ?? "";
    this.age = age ?? 0;
  }

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
