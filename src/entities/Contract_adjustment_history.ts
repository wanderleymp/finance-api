import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('contract_adjustment_history')
export class ContractAdjustmentHistory {
  @PrimaryGeneratedColumn()
  adjustment_history_id: number;

  @PrimaryGeneratedColumn()
  contract_id: number;

  @Column({ nullable: true })
  previous_value: number;

  @Column({ nullable: true })
  new_value: number;

  @Column({ nullable: true, default: new Date() })
  change_date: Date;

  @Column({ nullable: true, length: 50 })
  change_type: string;

  @Column({ nullable: true })
  changed_by: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}