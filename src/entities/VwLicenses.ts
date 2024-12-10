import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('vw_licenses')
export class VwLicenses {
  @Column()
  license_id: number;

  @Column()
  person_id: number;

  @Column()
  start_date: Date;

  @Column()
  end_date: Date;

  @Column()
  users: any;

  @Column({ length: 100 })
  license_name: string;

  @Column({ length: 20 })
  status: string;

  @Column({ length: 50 })
  timezone: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
