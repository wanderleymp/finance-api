import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('vw_cr_payments')
export class VwCrPayments {
  @PrimaryGeneratedColumn({ nullable: true })
  installment_payment_id: number;

  @Column({ nullable: true })
  payment_date: Date;

  @Column({ nullable: true })
  payment_date_display: string;

  @PrimaryGeneratedColumn({ nullable: true })
  paid_amount: number;

  @Column({ nullable: true })
  interest_amount: number;

  @Column({ nullable: true })
  discount_amount: number;

  @Column({ nullable: true })
  persons: any;

  @Column({ nullable: true })
  license: any;

  @Column({ nullable: true })
  installment: any;

  @Column({ nullable: true })
  bank: any;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}