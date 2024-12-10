import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('user_assignments')
export class UserAssignments {
  @PrimaryGeneratedColumn({ default: 'nextval(user_assignments_assignment_id_seq)' })
  assignment_id: number;

  @PrimaryGeneratedColumn()
  task_id: number;

  @PrimaryGeneratedColumn()
  user_id: number;

  @Column({ nullable: true, default: new Date() })
  assigned_at: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}