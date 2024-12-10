import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('accounts')
export class Accounts {
  @PrimaryGeneratedColumn({ default: 'nextval(accounts_account_id_seq)' })
  account_id: number;

  @Column({ length: 100 })
  account_name: string;

  @Column({ length: 20 })
  account_type: string;

  @Column({ nullable: true, default: 0 })
  account_balance: number;

  @PrimaryGeneratedColumn()
  license_id: number;

  @PrimaryGeneratedColumn()
  account_entry_id: number;

  @Column({ nullable: true, default: new Date() })
  created_at: Date;

  @Column({ nullable: true, default: new Date() })
  updated_at: Date;
}