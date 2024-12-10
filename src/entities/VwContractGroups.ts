import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('vw_contract_groups')
export class VwContractGroups {
  @Column()
  contract_group_id: number;

  @Column()
  licenses: any;

  @Column({ length: 100 })
  group_name: string;

  @Column()
  group_description: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
