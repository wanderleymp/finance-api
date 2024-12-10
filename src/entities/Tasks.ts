import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('tasks')
export class Tasks {
  @PrimaryGeneratedColumn({ default: 'nextval(tasks_task_id_seq)' })
  task_id: number;

  @PrimaryGeneratedColumn()
  process_id: number;

  @Column({ length: 255 })
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  assigned_to: number;

  @PrimaryGeneratedColumn()
  status_id: number;

  @PrimaryGeneratedColumn()
  execution_mode_id: number;

  @Column({ nullable: true })
  schedule: Date;

  @Column({ nullable: true, default: new Date() })
  created_at: Date;

  @Column({ nullable: true, default: new Date() })
  updated_at: Date;

  @Column({ nullable: true, default: 0 })
  retry_count: number;
}