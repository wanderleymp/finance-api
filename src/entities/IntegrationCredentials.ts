import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('integration_credentials')
export class IntegrationCredentials {
  @Column({ nullable: false, primary: true })
  credential_id: number;

  @Column()
  integration_id: number;

  @Column()
  license_id: number;

  @Column()
  created_at: string;

  @Column()
  updated_at: string;

  @Column({ nullable: false, length: 255 })
  client_id: string;

  @Column({ nullable: false, length: 255 })
  client_secret: string;

  @Column({ length: 255 })
  scope: string;

  @Column()
  certificate_data: string;

  @Column()
  key_data: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
