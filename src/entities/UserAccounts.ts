import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('user_accounts')
export class UserAccounts {
  @Column({ nullable: false, primary: true })
  user_id: number;

  @Column({ nullable: false })
  person_id: number;

  @Column({ nullable: false })
  profile_id: number;

  @Column({ nullable: false, length: 50 })
  username: string;

  @Column({ nullable: false, length: 255 })
  password: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
