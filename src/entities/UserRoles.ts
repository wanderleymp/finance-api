import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('user_roles')
export class UserRoles {
  @Column({ nullable: false, primary: true })
  user_id: number;

  @Column({ nullable: false, primary: true })
  role_id: number;

  @Column({ nullable: false, primary: true })
  license_id: number;

  @Column()
  created_at: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
