import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('integration_mappings')
export class IntegrationMappings {
  @PrimaryGeneratedColumn({ default: 'nextval(integration_mappings_mapping_id_seq)' })
  mapping_id: number;

  @PrimaryGeneratedColumn({ nullable: true })
  integration_id: number;

  @Column({ length: 50 })
  entity_type: string;

  @PrimaryGeneratedColumn()
  entity_id: number;

  @PrimaryGeneratedColumn({ length: 255 })
  external_id: string;

  @Column({ nullable: true })
  external_data: any;

  @Column({ nullable: true, default: new Date() })
  created_at: Date;

  @Column({ nullable: true, default: new Date() })
  updated_at: Date;

  @PrimaryGeneratedColumn({ nullable: true })
  entity_type_id: number;
}