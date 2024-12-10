import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('message_logs')
export class MessageLogs {
  @Column({ nullable: false, primary: true })
  log_id: number;

  @Column({ nullable: false })
  message_id: number;

  @Column({ nullable: false })
  status_id: number;

  @Column()
  occurred_at: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
