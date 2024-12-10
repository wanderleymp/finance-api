import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('account_movements')
export class AccountMovements {
  @Column({ length: 10 })
  movement_type: string;

  @Column()
  amount: number;

  @Column({ nullable: true, default: new Date() })
  movement_date: Date;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true, length: 50, default: 'ativo' })
  status: string;

  @PrimaryGeneratedColumn({ nullable: true })
  reference_id: number;

  @Column({ nullable: true, length: 50 })
  reference_type: string;

  @PrimaryGeneratedColumn()
  account_movement_id: number;

  @PrimaryGeneratedColumn({ nullable: true })
  account_entry_id: number;

  @PrimaryGeneratedColumn({ nullable: true })
  license_id: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}