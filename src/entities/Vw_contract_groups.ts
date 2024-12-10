import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('vw_contract_groups')
export class VwContractGroups {
  @PrimaryGeneratedColumn({ nullable: true })
  contract_group_id: number;

  @Column({ nullable: true, length: 100 })
  group_name: string;

  @Column({ nullable: true })
  group_description: string;

  @Column({ nullable: true })
  licenses: any;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}