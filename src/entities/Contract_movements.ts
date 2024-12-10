import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('contract_movements')
export class ContractMovements {
  @PrimaryGeneratedColumn()
  contract_id: number;

  @PrimaryGeneratedColumn()
  movement_id: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}