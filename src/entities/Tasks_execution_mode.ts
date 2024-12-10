import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('tasks_execution_mode')
export class TasksExecutionMode {
  @PrimaryGeneratedColumn({ default: 'nextval(tasks_execution_mode_execution_mode_id_seq)' })
  execution_mode_id: number;

  @Column({ length: 50 })
  name: string;

  @Column({ nullable: true, default: false })
  is_default: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}