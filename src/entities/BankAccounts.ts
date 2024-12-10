import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('bank_accounts')
export class BankAccounts {
  @Column({ nullable: false, primary: true })
  bank_account_id: number;

  @Column()
  account_entry_id: number;

  @Column()
  license_id: number;

  @Column({ nullable: false, length: 100 })
  bank_name: string;

  @Column({ nullable: false, length: 20 })
  agency_number: string;

  @Column({ nullable: false, length: 20 })
  account_number: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
