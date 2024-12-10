import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('contracts_recurring')
export class ContractsRecurring {
  @Column({ nullable: true, length: 255 })
  contract_name: string;

  @Column()
  contract_value: number;

  @Column()
  start_date: Date;

  @Column({ nullable: true })
  end_date: Date;

  @Column({ length: 50 })
  recurrence_period: string;

  @Column()
  due_day: number;

  @Column({ nullable: true, default: 0 })
  days_before_due: number;

  @Column({ nullable: true, length: 20, default: 'active' })
  status: string;

  @PrimaryGeneratedColumn({ nullable: true })
  model_movement_id: number;

  @Column({ nullable: true })
  last_billing_date: Date;

  @Column({ nullable: true })
  next_billing_date: Date;

  @PrimaryGeneratedColumn()
  contract_id: number;

  @PrimaryGeneratedColumn({ nullable: true })
  contract_group_id: number;

  @Column({ length: 20, default: 'current' })
  billing_reference: string;

  @PrimaryGeneratedColumn({ nullable: true })
  representative_person_id: number;

  @Column({ nullable: true })
  commissioned_value: number;

  @PrimaryGeneratedColumn({ nullable: true })
  account_entry_id: number;

  @Column({ nullable: true })
  last_decimo_billing_year: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}