import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('processes_tasks')
export class ProcessesTasks {
  @PrimaryGeneratedColumn({ default: 'nextval(processes_tasks_task_id_seq)' })
  task_id: number;

  @PrimaryGeneratedColumn({ nullable: true })
  process_type_id: number;

  @Column({ length: 255 })
  task_name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true, default: false })
  is_parallel: boolean;

  @Column({ nullable: true, default: true })
  is_standard: boolean;

  @Column({ nullable: true, default: new Date() })
  created_at: Date;

  @Column({ nullable: true, default: new Date() })
  updated_at: Date;
}