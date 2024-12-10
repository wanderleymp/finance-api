import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('task_logs')
export class TaskLogs {
  @Column({ nullable: false, primary: true })
  log_id: number;

  @Column({ nullable: false })
  task_id: number;

  @Column({ nullable: false })
  status_id: number;

  @Column()
  created_at: string;

  @Column()
  message: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
