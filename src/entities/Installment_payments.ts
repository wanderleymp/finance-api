import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('installment_payments')
export class InstallmentPayments {
  @PrimaryGeneratedColumn({ default: 'nextval(installment_payments_installment_payment_id_seq)' })
  installment_payment_id: number;

  @PrimaryGeneratedColumn()
  installment_id: number;

  @Column()
  payment_date: Date;

  @PrimaryGeneratedColumn()
  paid_amount: number;

  @Column({ nullable: true, default: 0.00 })
  interest_amount: number;

  @Column({ nullable: true, default: 0.00 })
  discount_amount: number;

  @PrimaryGeneratedColumn({ nullable: true })
  bank_account_id: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}