import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('receipts')
export class Receipts {
  @PrimaryGeneratedColumn({ default: 'nextval(receipts_receipt_id_seq)' })
  receipt_id: number;

  @PrimaryGeneratedColumn()
  installment_id: number;

  @Column({ nullable: true, default: new Date() })
  received_at: Date;

  @Column()
  amount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}