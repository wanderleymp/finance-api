import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('bank_accounts')
export class BankAccounts {
  @PrimaryGeneratedColumn({ default: 'nextval(bank_accounts_bank_account_id_seq)' })
  bank_account_id: number;

  @Column({ length: 100 })
  bank_name: string;

  @Column({ length: 20 })
  agency_number: string;

  @Column({ length: 20 })
  account_number: string;

  @PrimaryGeneratedColumn({ nullable: true })
  account_entry_id: number;

  @PrimaryGeneratedColumn({ nullable: true })
  license_id: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}