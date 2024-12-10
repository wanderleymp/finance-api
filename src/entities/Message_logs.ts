import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('message_logs')
export class MessageLogs {
  @PrimaryGeneratedColumn()
  log_id: number;

  @PrimaryGeneratedColumn()
  message_id: number;

  @PrimaryGeneratedColumn()
  status_id: number;

  @Column({ nullable: true, default: new Date() })
  occurred_at: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}