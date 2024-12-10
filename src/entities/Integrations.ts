import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('integrations')
export class Integrations {
  @PrimaryGeneratedColumn({ default: 'nextval(integrations_integration_id_seq)' })
  integration_id: number;

  @Column({ length: 255 })
  system_name: string;

  @Column({ nullable: true })
  system_description: string;

  @Column({ nullable: true, length: 255 })
  api_endpoint: string;

  @Column({ nullable: true, length: 50 })
  authentication_method: string;

  @Column({ nullable: true, default: new Date() })
  created_at: Date;

  @Column({ nullable: true, default: new Date() })
  updated_at: Date;

  @Column({ nullable: true, default: true })
  is_global: boolean;
}