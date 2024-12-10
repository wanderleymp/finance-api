import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('contract_extra_services')
export class ContractExtraServices {
  @PrimaryGeneratedColumn()
  extra_service_id: number;

  @PrimaryGeneratedColumn()
  contract_id: number;

  @PrimaryGeneratedColumn()
  service_id: number;

  @Column()
  item_description: string;

  @Column()
  item_value: number;

  @Column()
  service_date: Date;

  @PrimaryGeneratedColumn({ nullable: true })
  movement_id: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}