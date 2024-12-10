import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('contract_billing_logs')
export class ContractBillingLogs {
  @PrimaryGeneratedColumn({ default: 'nextval(contract_billing_logs_log_id_seq)' })
  log_id: number;

  @PrimaryGeneratedColumn({ nullable: true })
  contract_id: number;

  @PrimaryGeneratedColumn({ nullable: true })
  movement_id: number;

  @Column({ nullable: true })
  log_message: string;

  @Column({ nullable: true, default: new Date() })
  log_timestamp: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}