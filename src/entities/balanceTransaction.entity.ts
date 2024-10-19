import { Entity, Column, PrimaryGeneratedColumn, Index } from "typeorm";

@Entity("transactions")
@Index("idx_protocol", ["protocol"])
@Index("idx_emails", ["originUserEmail", "targetUserEmail"])
@Index("idx_refunded", ["refunded"])
export class BalanceTransaction {
  @PrimaryGeneratedColumn()
    id: number;

  @Column({ type: "uuid", unique: true })
    protocol: string;

  @Column()
    originUserEmail: string;

  @Column()
    targetUserEmail: string;

  @Column({ type: "decimal", precision: 10, scale: 2 })
    amountTransferred: number;

  @Column({ default: false })
    refunded: boolean;

  @Column({ nullable: true })
    refundedBy: string;

  @Column({ type: "datetime", nullable: true })
    refundedAt: Date;

  @Column({ nullable: true })
    refundReason: string;

  @Column({ type: "datetime", default: () => "NOW()" })
    createdAt: Date;
}
