import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('task_dependencies')
export class TaskDependencies {
  @Column({ nullable: false, primary: true })
  dependency_id: number;

  @Column({ nullable: false })
  task_id: number;

  @Column({ nullable: false })
  depends_on: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
