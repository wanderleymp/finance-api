import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('contract_adjustments')
export class ContractAdjustments {
  @PrimaryGeneratedColumn()
  adjustment_id: number;

  @PrimaryGeneratedColumn()
  contract_id: number;

  @Column({ nullable: true, length: 50 })
  adjustment_type: string;

  @Column({ nullable: true })
  adjustment_value: number;

  @Column({ nullable: true })
  adjustment_date: Date;

  @PrimaryGeneratedColumn({ nullable: true })
  movement_id: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}