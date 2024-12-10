import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('vw_user_details')
export class VwUserDetails {
  @PrimaryGeneratedColumn({ nullable: true })
  user_id: number;

  @Column({ nullable: true, length: 50 })
  username: string;

  @Column({ nullable: true })
  person: any;

  @Column({ nullable: true })
  licenses: any;

  @Column({ nullable: true })
  permissions: any;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}