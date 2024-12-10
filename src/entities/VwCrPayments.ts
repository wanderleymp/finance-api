import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('vw_cr_payments')
export class VwCrPayments {
  @Column()
  installment_payment_id: number;

  @Column()
  payment_date: Date;

  @Column()
  paid_amount: string;

  @Column()
  interest_amount: string;

  @Column()
  discount_amount: string;

  @Column()
  persons: any;

  @Column()
  license: any;

  @Column()
  installment: any;

  @Column()
  bank: any;

  @Column()
  payment_date_display: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
