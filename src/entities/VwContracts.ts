import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('vw_contracts')
export class VwContracts {
  @Column()
  contract_id: number;

  @Column()
  contract_value: string;

  @Column()
  start_date: Date;

  @Column()
  end_date: Date;

  @Column()
  due_day: number;

  @Column()
  days_before_due: number;

  @Column()
  last_billing_date: Date;

  @Column()
  next_billing_date: Date;

  @Column()
  contract_group_id: number;

  @Column()
  person_id: number;

  @Column()
  model_movement_id: number;

  @Column()
  model_movement_date: Date;

  @Column()
  model_total_amount: string;

  @Column({ length: 255 })
  person_name: string;

  @Column({ length: 255 })
  contract_name: string;

  @Column({ length: 100 })
  contract_group_name: string;

  @Column({ length: 50 })
  recurrence_period: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
