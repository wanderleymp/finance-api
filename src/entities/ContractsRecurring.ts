import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('contracts_recurring')
export class ContractsRecurring {
  @Column({ nullable: false })
  contract_value: string;

  @Column({ nullable: false })
  start_date: Date;

  @Column()
  end_date: Date;

  @Column({ nullable: false })
  due_day: number;

  @Column()
  days_before_due: number;

  @Column()
  model_movement_id: number;

  @Column()
  last_billing_date: Date;

  @Column()
  next_billing_date: Date;

  @Column({ nullable: false, primary: true })
  contract_id: number;

  @Column()
  contract_group_id: number;

  @Column()
  representative_person_id: number;

  @Column()
  commissioned_value: string;

  @Column()
  account_entry_id: number;

  @Column()
  last_decimo_billing_year: number;

  @Column({ length: 255 })
  contract_name: string;

  @Column({ nullable: false, length: 50 })
  recurrence_period: string;

  @Column({ length: 20 })
  status: string;

  @Column({ nullable: false, length: 20 })
  billing_reference: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
