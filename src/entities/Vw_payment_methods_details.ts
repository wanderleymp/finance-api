import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('vw_payment_methods_details')
export class VwPaymentMethodsDetails {
  @PrimaryGeneratedColumn({ nullable: true })
  payment_method_id: number;

  @Column({ nullable: true, length: 50 })
  method_name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  has_entry: boolean;

  @Column({ nullable: true })
  installment_count: number;

  @Column({ nullable: true })
  days_between_installments: number;

  @Column({ nullable: true })
  first_due_date_days: number;

  @Column({ nullable: true })
  account_entry: any;

  @Column({ nullable: true })
  bank_account: any;

  @Column({ nullable: true })
  integration_credentials: any;

  @Column({ nullable: true })
  integration_mapping: any;

  @Column({ nullable: true })
  payment_document_type: any;

  @Column({ nullable: true })
  licenses: any;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}