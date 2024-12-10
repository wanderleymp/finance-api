import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('service_group_relationship')
export class ServiceGroupRelationship {
  @PrimaryGeneratedColumn({ default: 'nextval(service_group_relationship_service_group_relationship_id_seq)' })
  service_group_relationship_id: number;

  @PrimaryGeneratedColumn()
  service_group_id: number;

  @Column({ nullable: true, default: new Date() })
  created_at: Date;

  @Column({ nullable: true, default: new Date() })
  updated_at: Date;
}