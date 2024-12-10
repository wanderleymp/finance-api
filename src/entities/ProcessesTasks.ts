import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('processes_tasks')
export class ProcessesTasks {
  @Column({ nullable: false, primary: true })
  task_id: number;

  @Column()
  process_type_id: number;

  @Column()
  is_parallel: boolean;

  @Column()
  is_standard: boolean;

  @Column()
  created_at: string;

  @Column()
  updated_at: string;

  @Column({ nullable: false, length: 255 })
  task_name: string;

  @Column()
  description: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
