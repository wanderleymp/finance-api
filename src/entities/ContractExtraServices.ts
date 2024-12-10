import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('contract_extra_services')
export class ContractExtraServices {
  @Column({ nullable: false, primary: true })
  extra_service_id: number;

  @Column({ nullable: false })
  contract_id: number;

  @Column({ nullable: false })
  service_id: number;

  @Column({ nullable: false })
  item_value: string;

  @Column({ nullable: false })
  service_date: Date;

  @Column()
  movement_id: number;

  @Column({ nullable: false })
  item_description: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
