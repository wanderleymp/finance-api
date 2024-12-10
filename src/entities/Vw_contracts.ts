import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('vw_contracts')
export class VwContracts {
  @PrimaryGeneratedColumn({ nullable: true })
  contract_id: number;

  @Column({ nullable: true, length: 255 })
  contract_name: string;

  @Column({ nullable: true })
  contract_value: number;

  @Column({ nullable: true })
  start_date: Date;

  @Column({ nullable: true })
  end_date: Date;

  @Column({ nullable: true, length: 50 })
  recurrence_period: string;

  @Column({ nullable: true })
  due_day: number;

  @Column({ nullable: true })
  days_before_due: number;

  @Column({ nullable: true })
  last_billing_date: Date;

  @Column({ nullable: true })
  next_billing_date: Date;

  @PrimaryGeneratedColumn({ nullable: true })
  contract_group_id: number;

  @Column({ nullable: true, length: 100 })
  contract_group_name: string;

  @PrimaryGeneratedColumn({ nullable: true })
  person_id: number;

  @Column({ nullable: true, length: 255 })
  person_name: string;

  @PrimaryGeneratedColumn({ nullable: true })
  model_movement_id: number;

  @Column({ nullable: true })
  model_movement_date: Date;

  @Column({ nullable: true })
  model_total_amount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}