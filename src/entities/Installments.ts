import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('installments')
export class Installments {
  @PrimaryGeneratedColumn()
  installment_id: number;

  @PrimaryGeneratedColumn()
  payment_id: number;

  @Column({ length: 10 })
  installment_number: string;

  @Column()
  due_date: Date;

  @Column()
  amount: number;

  @Column()
  balance: number;

  @Column({ length: 20 })
  status: string;

  @PrimaryGeneratedColumn()
  account_entry_id: number;

  @Column({ nullable: true })
  expected_date: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}