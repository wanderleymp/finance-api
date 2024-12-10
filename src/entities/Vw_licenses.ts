import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('vw_licenses')
export class VwLicenses {
  @PrimaryGeneratedColumn({ nullable: true })
  license_id: number;

  @PrimaryGeneratedColumn({ nullable: true })
  person_id: number;

  @Column({ nullable: true, length: 100 })
  license_name: string;

  @Column({ nullable: true })
  start_date: Date;

  @Column({ nullable: true })
  end_date: Date;

  @Column({ nullable: true, length: 20 })
  status: string;

  @Column({ nullable: true, length: 50 })
  timezone: string;

  @Column({ nullable: true })
  users: any;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}