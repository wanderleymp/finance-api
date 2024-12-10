import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('task_logs')
export class TaskLogs {
  @PrimaryGeneratedColumn({ default: 'nextval(task_logs_log_id_seq)' })
  log_id: number;

  @PrimaryGeneratedColumn()
  task_id: number;

  @PrimaryGeneratedColumn()
  status_id: number;

  @Column({ nullable: true })
  message: string;

  @Column({ nullable: true, default: new Date() })
  created_at: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}