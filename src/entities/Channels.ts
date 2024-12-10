import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('channels')
export class Channels {
  @PrimaryGeneratedColumn({ default: 'nextval(channels_channel_id_seq)' })
  channel_id: number;

  @Column({ length: 255 })
  channel_name: string;

  @PrimaryGeneratedColumn()
  contact_type_id: number;

  @Column({ nullable: true, length: 20 })
  contact_value: string;

  @Column({ nullable: true, default: true })
  is_active: boolean;

  @PrimaryGeneratedColumn({ nullable: true })
  department_id: number;

  @Column({ nullable: true, default: new Date() })
  created_at: Date;

  @Column({ nullable: true, default: new Date() })
  updated_at: Date;
}