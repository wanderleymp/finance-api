import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('movement_payments')
export class MovementPayments {
  @PrimaryGeneratedColumn()
  payment_id: number;

  @PrimaryGeneratedColumn()
  movement_id: number;

  @PrimaryGeneratedColumn()
  payment_method_id: number;

  @Column()
  total_amount: number;

  @Column({ nullable: true, length: 20, default: 'Pendente' })
  status: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}