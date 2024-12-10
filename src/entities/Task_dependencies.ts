import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('task_dependencies')
export class TaskDependencies {
  @PrimaryGeneratedColumn({ default: 'nextval(task_dependencies_dependency_id_seq)' })
  dependency_id: number;

  @PrimaryGeneratedColumn()
  task_id: number;

  @Column()
  depends_on: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}