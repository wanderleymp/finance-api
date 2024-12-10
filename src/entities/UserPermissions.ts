import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('user_permissions')
export class UserPermissions {
  @Column({ nullable: false, primary: true })
  permission_id: number;

  @Column()
  created_at: string;

  @Column({ nullable: false, length: 100 })
  permission_name: string;

  @Column()
  description: string;

  @Column({ nullable: false, length: 50 })
  resource: string;

  @Column({ nullable: false, length: 20 })
  action: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
