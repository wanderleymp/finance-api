import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('user_permissions')
export class UserPermissions {
  @PrimaryGeneratedColumn({ default: 'nextval(permissions_permission_id_seq)' })
  permission_id: number;

  @Column({ length: 100 })
  permission_name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ length: 50 })
  resource: string;

  @Column({ length: 20 })
  action: string;

  @Column({ nullable: true, default: new Date() })
  created_at: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}