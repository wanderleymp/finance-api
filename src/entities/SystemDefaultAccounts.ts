import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('system_default_accounts')
export class SystemDefaultAccounts {
  @Column({ nullable: false, primary: true })
  default_account_id: number;

  @Column({ nullable: false })
  account_entry_id: number;

  @Column()
  created_at: string;

  @Column({ nullable: false, length: 50 })
  account_type: string;

  @Column()
  description: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
