import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('contract_group_licenses')
export class ContractGroupLicenses {
  @PrimaryGeneratedColumn()
  contract_group_id: number;

  @PrimaryGeneratedColumn()
  license_id: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}