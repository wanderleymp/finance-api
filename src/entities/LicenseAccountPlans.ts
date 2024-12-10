import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('license_account_plans')
export class LicenseAccountPlans {
  @Column({ nullable: false, primary: true })
  license_id: number;

  @Column({ nullable: false, primary: true })
  account_plan_id: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
