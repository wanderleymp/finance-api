import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('license_api_chat')
export class LicenseApiChat {
  @PrimaryGeneratedColumn({ default: 'nextval(license_api_chat_license_api_chat_id_seq)' })
  license_api_chat_id: number;

  @PrimaryGeneratedColumn()
  license_id: number;

  @Column({ length: 255 })
  instance_name: string;

  @Column()
  api_url: string;

  @Column({ length: 255 })
  api_key: string;

  @Column({ nullable: true, default: new Date() })
  created_at: Date;

  @Column({ nullable: true, default: new Date() })
  updated_at: Date;
}