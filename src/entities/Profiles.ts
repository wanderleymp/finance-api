import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('profiles')
export class Profiles {
  @PrimaryGeneratedColumn({ default: 'nextval(profiles_profile_id_seq)' })
  profile_id: number;

  @Column({ length: 50 })
  description: string;

  @Column({ length: 255 })
  profile_name: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}