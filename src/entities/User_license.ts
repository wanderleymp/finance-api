import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('user_license')
export class UserLicense {
  @PrimaryGeneratedColumn({ default: 'nextval(user_license_user_license_id_seq)' })
  user_license_id: number;

  @PrimaryGeneratedColumn()
  user_id: number;

  @PrimaryGeneratedColumn()
  license_id: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}