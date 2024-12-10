import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('license_account_plans')
export class LicenseAccountPlans {
  @PrimaryGeneratedColumn()
  license_id: number;

  @PrimaryGeneratedColumn()
  account_plan_id: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}