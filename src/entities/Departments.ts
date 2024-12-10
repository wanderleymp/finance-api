import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('departments')
export class Departments {
  @PrimaryGeneratedColumn({ default: 'nextval(departments_department_id_seq)' })
  department_id: number;

  @Column({ length: 255 })
  department_name: string;

  @Column({ nullable: true })
  permissions: any;

  @Column({ nullable: true, default: new Date() })
  created_at: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}