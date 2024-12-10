import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('payment_splits')
export class PaymentSplits {
  @Column({ nullable: false, primary: true })
  split_id: number;

  @Column({ nullable: false })
  payment_method_id: number;

  @Column({ nullable: false })
  recipient_account_id: number;

  @Column({ nullable: false })
  split_percentage: string;

  @Column()
  split_amount: string;

  @Column()
  created_at: string;

  @Column()
  updated_at: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
