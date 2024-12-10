import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('role_permissions')
export class RolePermissions {
  @Column({ nullable: false, primary: true })
  role_id: number;

  @Column({ nullable: false, primary: true })
  permission_id: number;

  @Column()
  created_at: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
