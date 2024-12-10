import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('account_entries')
export class AccountEntries {
  @Column({ nullable: false, primary: true })
  account_entry_id: number;

  @Column()
  account_plan_id: number;

  @Column()
  parent_account_id: number;

  @Column()
  account_level: number;

  @Column()
  created_at: string;

  @Column()
  updated_at: string;

  @Column()
  is_contra_account: boolean;

  @Column({ nullable: false, length: 50 })
  account_code: string;

  @Column({ nullable: false, length: 100 })
  account_name: string;

  @Column({ nullable: false, length: 50 })
  account_type: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
