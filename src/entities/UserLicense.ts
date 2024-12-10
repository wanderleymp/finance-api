import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('user_license')
export class UserLicense {
  @Column({ nullable: false, primary: true })
  user_license_id: number;

  @Column({ nullable: false })
  user_id: number;

  @Column({ nullable: false })
  license_id: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
