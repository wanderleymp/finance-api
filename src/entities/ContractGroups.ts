import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('contract_groups')
export class ContractGroups {
  @Column({ nullable: false, primary: true })
  contract_group_id: number;

  @Column({ nullable: false })
  has_decimo_terceiro: boolean;

  @Column()
  vencimento1_dia: string;

  @Column()
  vencimento1_mes: string;

  @Column()
  vencimento2_dia: string;

  @Column()
  vencimento2_mes: string;

  @Column()
  decimo_payment_method_id: number;

  @Column({ nullable: false, length: 100 })
  group_name: string;

  @Column()
  group_description: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
