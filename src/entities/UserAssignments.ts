import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('user_assignments')
export class UserAssignments {
  @Column({ nullable: false, primary: true })
  assignment_id: number;

  @Column({ nullable: false })
  task_id: number;

  @Column({ nullable: false })
  user_id: number;

  @Column()
  assigned_at: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
