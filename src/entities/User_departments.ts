import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('user_departments')
export class UserDepartments {
  @PrimaryGeneratedColumn({ default: 'nextval(user_departments_user_department_id_seq)' })
  user_department_id: number;

  @PrimaryGeneratedColumn()
  user_id: number;

  @PrimaryGeneratedColumn()
  department_id: number;

  @Column({ nullable: true, default: new Date() })
  created_at: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}