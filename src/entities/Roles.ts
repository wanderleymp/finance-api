import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('roles')
export class Roles {
  @PrimaryGeneratedColumn({ default: 'nextval(roles_role_id_seq)' })
  role_id: number;

  @Column({ length: 50 })
  role_name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true, default: new Date() })
  created_at: Date;

  @Column({ nullable: true, default: new Date() })
  updated_at: Date;

  @Column({ nullable: true, length: 20, default: 'active' })
  status: string;
}