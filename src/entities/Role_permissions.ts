import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('role_permissions')
export class RolePermissions {
  @PrimaryGeneratedColumn()
  role_id: number;

  @PrimaryGeneratedColumn()
  permission_id: number;

  @Column({ nullable: true, default: new Date() })
  created_at: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}