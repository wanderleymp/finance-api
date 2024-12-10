import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('vw_payment_methods_details')
export class VwPaymentMethodsDetails {
  @Column()
  payment_method_id: number;

  @Column()
  has_entry: boolean;

  @Column()
  installment_count: number;

  @Column()
  days_between_installments: number;

  @Column()
  first_due_date_days: number;

  @Column()
  account_entry: any;

  @Column()
  bank_account: any;

  @Column()
  integration_credentials: any;

  @Column()
  integration_mapping: any;

  @Column()
  payment_document_type: any;

  @Column()
  licenses: any;

  @Column({ length: 50 })
  method_name: string;

  @Column()
  description: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
