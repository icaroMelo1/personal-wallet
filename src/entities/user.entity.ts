import { Entity, PrimaryGeneratedColumn, Column, Index } from "typeorm";

@Entity("users")
@Index("idx_email", ["email"])
export class User {
  @PrimaryGeneratedColumn()
    id: number;

  @Column({ nullable: false })
    name: string;

  @Column({ unique: true })
    email: string;

  @Column({ nullable: false })
    password: string;

  @Column({ type: "decimal", precision: 10, scale: 2 })
    balance: number;
}
