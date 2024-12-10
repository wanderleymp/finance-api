import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('installment_payments')
export class InstallmentPayments {
  @Column({ nullable: false, primary: true })
  installment_payment_id: number;

  @Column({ nullable: false })
  installment_id: number;

  @Column({ nullable: false })
  payment_date: Date;

  @Column({ nullable: false })
  paid_amount: string;

  @Column()
  interest_amount: string;

  @Column()
  discount_amount: string;

  @Column()
  bank_account_id: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
