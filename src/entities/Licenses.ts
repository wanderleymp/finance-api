import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('licenses')
export class Licenses {
  @PrimaryGeneratedColumn({ default: 'nextval(licenses_license_id_seq)' })
  license_id: number;

  @PrimaryGeneratedColumn()
  person_id: number;

  @Column({ length: 100 })
  license_name: string;

  @Column()
  start_date: Date;

  @Column({ nullable: true })
  end_date: Date;

  @Column({ length: 20, default: 'Ativa' })
  status: string;

  @Column({ nullable: true, length: 50 })
  timezone: string;

  @Column({ default: true })
  active: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}