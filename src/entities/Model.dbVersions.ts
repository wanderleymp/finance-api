import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('model.db_versions')
export class Model.dbVersions {
  @Column({ nullable: false, primary: true })
  version_id: number;

  @Column()
  created_at: string;

  @Column({ nullable: false, length: 50 })
  version_name: string;

  @Column()
  description: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
