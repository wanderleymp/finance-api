import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('user_accounts')
export class UserAccounts {
  @PrimaryGeneratedColumn({ default: 'nextval(user_accounts_user_id_seq)' })
  user_id: number;

  @Column({ length: 50 })
  username: string;

  @Column({ length: 255 })
  password: string;

  @PrimaryGeneratedColumn()
  person_id: number;

  @PrimaryGeneratedColumn()
  profile_id: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}