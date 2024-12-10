import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('contract_adjustment_history')
export class ContractAdjustmentHistory {
  @Column({ nullable: false, primary: true })
  adjustment_history_id: number;

  @Column({ nullable: false })
  contract_id: number;

  @Column()
  previous_value: string;

  @Column()
  new_value: string;

  @Column()
  change_date: string;

  @Column()
  changed_by: number;

  @Column({ length: 50 })
  change_type: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
