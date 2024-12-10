import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('recurring_tasks')
export class RecurringTasks {
  @PrimaryGeneratedColumn({ default: 'nextval(recurring_tasks_recurring_task_id_seq)' })
  recurring_task_id: number;

  @PrimaryGeneratedColumn()
  task_id: number;

  @Column({ length: 255 })
  recurrence_rule: string;

  @Column()
  next_run: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}