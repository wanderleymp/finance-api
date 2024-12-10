import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('db_versions')
export class DbVersions {
  @PrimaryGeneratedColumn({ default: 'nextval(model.db_versions_version_id_seq)' })
  version_id: number;

  @Column({ length: 50 })
  version_name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true, default: new Date() })
  created_at: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}