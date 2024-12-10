import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('profile_permissions')
export class ProfilePermissions {
  @PrimaryGeneratedColumn({ default: 'nextval(profile_permissions_permission_id_seq)' })
  permission_id: number;

  @PrimaryGeneratedColumn()
  profile_id: number;

  @PrimaryGeneratedColumn()
  feature_id: number;

  @Column({ nullable: true, default: true })
  can_access: boolean;

  @Column({ nullable: true, default: new Date() })
  created_at: Date;

  @Column({ nullable: true, default: new Date() })
  updated_at: Date;
}