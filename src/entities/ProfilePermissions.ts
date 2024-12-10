import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('profile_permissions')
export class ProfilePermissions {
  @Column({ nullable: false, primary: true })
  permission_id: number;

  @Column({ nullable: false })
  profile_id: number;

  @Column({ nullable: false })
  feature_id: number;

  @Column()
  can_access: boolean;

  @Column()
  created_at: string;

  @Column()
  updated_at: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
