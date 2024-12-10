import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('contract_groups')
export class ContractGroups {
  @PrimaryGeneratedColumn()
  contract_group_id: number;

  @Column({ length: 100 })
  group_name: string;

  @Column({ nullable: true })
  group_description: string;

  @Column({ default: false })
  has_decimo_terceiro: boolean;

  @Column({ nullable: true })
  vencimento1_dia: number;

  @Column({ nullable: true })
  vencimento1_mes: number;

  @Column({ nullable: true })
  vencimento2_dia: number;

  @Column({ nullable: true })
  vencimento2_mes: number;

  @PrimaryGeneratedColumn({ nullable: true, default: 4 })
  decimo_payment_method_id: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}