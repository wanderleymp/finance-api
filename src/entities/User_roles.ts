import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('user_roles')
export class UserRoles {
  @PrimaryGeneratedColumn()
  user_id: number;

  @PrimaryGeneratedColumn()
  role_id: number;

  @PrimaryGeneratedColumn()
  license_id: number;

  @Column({ nullable: true, default: new Date() })
  created_at: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}