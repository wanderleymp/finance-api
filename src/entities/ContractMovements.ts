import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('contract_movements')
export class ContractMovements {
  @Column({ nullable: false, primary: true })
  contract_id: number;

  @Column({ nullable: false, primary: true })
  movement_id: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
