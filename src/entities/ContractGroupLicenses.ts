import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('contract_group_licenses')
export class ContractGroupLicenses {
  @Column({ nullable: false, primary: true })
  contract_group_id: number;

  @Column({ nullable: false, primary: true })
  license_id: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
