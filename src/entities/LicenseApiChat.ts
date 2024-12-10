import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('license_api_chat')
export class LicenseApiChat {
  @Column({ nullable: false, primary: true })
  license_api_chat_id: number;

  @Column({ nullable: false })
  license_id: number;

  @Column()
  created_at: string;

  @Column()
  updated_at: string;

  @Column({ nullable: false, length: 255 })
  instance_name: string;

  @Column({ nullable: false })
  api_url: string;

  @Column({ nullable: false, length: 255 })
  api_key: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
