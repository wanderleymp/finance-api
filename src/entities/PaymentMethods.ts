import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('payment_methods')
export class PaymentMethods {
  @Column({ nullable: false, primary: true })
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
  account_entry_id: number;

  @Column()
  integration_mapping_id: number;

  @Column()
  payment_document_type_id: number;

  @Column()
  credential_id: number;

  @Column()
  bank_account_id: number;

  @Column({ nullable: false })
  active: boolean;

  @Column({ nullable: false })
  created_at: string;

  @Column({ nullable: false })
  updated_at: string;

  @Column()
  deleted_at: string;

  @Column({ nullable: false, length: 50 })
  method_name: string;

  @Column()
  description: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
