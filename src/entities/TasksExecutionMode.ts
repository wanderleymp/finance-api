import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('tasks_execution_mode')
export class TasksExecutionMode {
  @Column({ nullable: false, primary: true })
  execution_mode_id: number;

  @Column()
  is_default: boolean;

  @Column({ nullable: false, length: 50 })
  name: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
