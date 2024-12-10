import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('account_entries')
export class AccountEntries {
  @PrimaryGeneratedColumn()
  account_entry_id: number;

  @PrimaryGeneratedColumn({ nullable: true })
  account_plan_id: number;

  @PrimaryGeneratedColumn({ nullable: true })
  parent_account_id: number;

  @Column({ length: 50 })
  account_code: string;

  @Column({ length: 100 })
  account_name: string;

  @Column({ length: 50 })
  account_type: string;

  @Column({ nullable: true, default: 1 })
  account_level: number;

  @Column({ nullable: true, default: new Date() })
  created_at: Date;

  @Column({ nullable: true, default: new Date() })
  updated_at: Date;

  @Column({ nullable: true, default: false })
  is_contra_account: boolean;
}