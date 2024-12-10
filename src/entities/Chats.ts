import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('chats')
export class Chats {
  @PrimaryGeneratedColumn({ default: 'nextval(chats_chat_id_seq)' })
  chat_id: number;

  @PrimaryGeneratedColumn()
  person_id: number;

  @PrimaryGeneratedColumn({ nullable: true })
  channel_id: number;

  @Column({ nullable: true, length: 255 })
  chat_classification: string;

  @Column({ nullable: true, length: 50, default: 'medium' })
  chat_priority: string;

  @Column({ nullable: true, length: 50, default: 'not_attended' })
  chat_status: string;

  @Column({ nullable: true })
  assigned_to: number;

  @Column({ nullable: true, default: false })
  is_internal: boolean;

  @Column({ nullable: true, default: new Date() })
  created_at: Date;

  @Column({ nullable: true, default: new Date() })
  updated_at: Date;
}