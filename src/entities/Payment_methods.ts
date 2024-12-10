import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('payment_methods')
export class PaymentMethods {
  @PrimaryGeneratedColumn()
  payment_method_id: number;

  @Column({ length: 50 })
  method_name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true, default: false })
  has_entry: boolean;

  @Column({ nullable: true, default: 1 })
  installment_count: number;

  @Column({ nullable: true, default: 30 })
  days_between_installments: number;

  @Column({ nullable: true, default: 30 })
  first_due_date_days: number;

  @PrimaryGeneratedColumn({ nullable: true })
  account_entry_id: number;

  @PrimaryGeneratedColumn({ nullable: true })
  integration_mapping_id: number;

  @PrimaryGeneratedColumn({ nullable: true })
  payment_document_type_id: number;

  @PrimaryGeneratedColumn({ nullable: true })
  credential_id: number;

  @PrimaryGeneratedColumn({ nullable: true })
  bank_account_id: number;

  @Column({ default: true })
  active: boolean;

  @Column({ default: new Date() })
  created_at: Date;

  @Column({ default: new Date() })
  updated_at: Date;

  @Column({ nullable: true })
  deleted_at: Date;
}