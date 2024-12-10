import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('service_groups')
export class ServiceGroups {
  @PrimaryGeneratedColumn({ default: 'nextval(service_groups_service_group_id_seq)' })
  service_group_id: number;

  @Column({ length: 255 })
  group_name: string;

  @Column({ nullable: true })
  group_description: string;

  @PrimaryGeneratedColumn({ nullable: true })
  account_entry_id: number;

  @Column({ nullable: true, default: new Date() })
  created_at: Date;

  @Column({ nullable: true, default: new Date() })
  updated_at: Date;

  @PrimaryGeneratedColumn({ nullable: true })
  service_municipality_id: number;
}