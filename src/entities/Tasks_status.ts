import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('tasks_status')
export class TasksStatus {
  @PrimaryGeneratedColumn({ default: 'nextval(tasks_status_status_id_seq)' })
  status_id: number;

  @Column({ length: 50 })
  name: string;

  @Column({ nullable: true, default: false })
  is_default: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}