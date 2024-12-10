import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('vw_user_details')
export class VwUserDetails {
  @Column()
  user_id: number;

  @Column()
  person: any;

  @Column()
  licenses: any;

  @Column()
  permissions: any;

  @Column({ length: 50 })
  username: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
