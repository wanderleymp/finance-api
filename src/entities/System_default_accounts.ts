import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('system_default_accounts')
export class SystemDefaultAccounts {
  @PrimaryGeneratedColumn({ default: 'nextval(system_default_accounts_default_account_id_seq)' })
  default_account_id: number;

  @Column({ length: 50 })
  account_type: string;

  @PrimaryGeneratedColumn()
  account_entry_id: number;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true, default: new Date() })
  created_at: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}