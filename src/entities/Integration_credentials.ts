import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('integration_credentials')
export class IntegrationCredentials {
  @PrimaryGeneratedColumn({ default: 'nextval(integration_credentials_credential_id_seq)' })
  credential_id: number;

  @PrimaryGeneratedColumn({ nullable: true })
  integration_id: number;

  @PrimaryGeneratedColumn({ nullable: true })
  license_id: number;

  @PrimaryGeneratedColumn({ length: 255 })
  client_id: string;

  @Column({ length: 255 })
  client_secret: string;

  @Column({ nullable: true, length: 255 })
  scope: string;

  @Column({ nullable: true, default: new Date() })
  created_at: Date;

  @Column({ nullable: true, default: new Date() })
  updated_at: Date;

  @Column({ nullable: true })
  certificate_data: string;

  @Column({ nullable: true })
  key_data: string;
}