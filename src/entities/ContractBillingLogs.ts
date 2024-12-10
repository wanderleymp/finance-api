import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('contract_billing_logs')
export class ContractBillingLogs {
  @Column({ nullable: false, primary: true })
  log_id: number;

  @Column()
  contract_id: number;

  @Column()
  movement_id: number;

  @Column()
  log_timestamp: string;

  @Column()
  log_message: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
