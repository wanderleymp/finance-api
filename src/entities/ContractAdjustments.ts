import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('contract_adjustments')
export class ContractAdjustments {
  @Column({ nullable: false, primary: true })
  adjustment_id: number;

  @Column({ nullable: false })
  contract_id: number;

  @Column()
  adjustment_value: string;

  @Column()
  adjustment_date: Date;

  @Column()
  movement_id: number;

  @Column({ length: 50 })
  adjustment_type: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
