import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('chat_logs')
export class ChatLogs {
  @Column({ nullable: false, primary: true })
  chat_log_id: number;

  @Column({ nullable: false })
  chat_id: number;

  @Column()
  event_details: any;

  @Column()
  performed_by: number;

  @Column()
  created_at: string;

  @Column({ nullable: false, length: 255 })
  event_type: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
