import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('account_plans')
export class AccountPlans {
  @PrimaryGeneratedColumn({ default: 'nextval(account_plans_account_plan_id_seq)' })
  account_plan_id: number;

  @Column({ length: 100 })
  plan_name: string;

  @Column({ nullable: true })
  plan_description: string;

  @Column({ nullable: true, default: new Date() })
  created_at: Date;

  @Column({ nullable: true, default: new Date() })
  updated_at: Date;
}