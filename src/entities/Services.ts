import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('services')
export class Services {
  @PrimaryGeneratedColumn({ default: 'nextval(services_service_id_seq)' })
  service_id: number;

  @PrimaryGeneratedColumn()
  item_id: number;

  @PrimaryGeneratedColumn({ nullable: true })
  service_group_id: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}