import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('user_departments')
export class UserDepartments {
  @Column({ nullable: false, primary: true })
  user_department_id: number;

  @Column({ nullable: false })
  user_id: number;

  @Column({ nullable: false })
  department_id: number;

  @Column()
  created_at: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
