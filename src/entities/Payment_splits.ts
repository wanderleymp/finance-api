import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('payment_splits')
export class PaymentSplits {
  @PrimaryGeneratedColumn()
  split_id: number;

  @PrimaryGeneratedColumn()
  payment_method_id: number;

  @PrimaryGeneratedColumn()
  recipient_account_id: number;

  @Column()
  split_percentage: number;

  @Column({ nullable: true })
  split_amount: number;

  @Column({ nullable: true, default: new Date() })
  created_at: Date;

  @Column({ nullable: true, default: new Date() })
  updated_at: Date;
}