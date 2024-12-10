import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('recurring_tasks')
export class RecurringTasks {
  @Column({ nullable: false, primary: true })
  recurring_task_id: number;

  @Column({ nullable: false })
  task_id: number;

  @Column({ nullable: false })
  next_run: string;

  @Column({ nullable: false, length: 255 })
  recurrence_rule: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
