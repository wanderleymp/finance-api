import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('chat_logs')
export class ChatLogs {
  @PrimaryGeneratedColumn({ default: 'nextval(chat_logs_chat_log_id_seq)' })
  chat_log_id: number;

  @PrimaryGeneratedColumn()
  chat_id: number;

  @Column({ length: 255 })
  event_type: string;

  @Column({ nullable: true })
  event_details: any;

  @Column({ nullable: true })
  performed_by: number;

  @Column({ nullable: true, default: new Date() })
  created_at: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}