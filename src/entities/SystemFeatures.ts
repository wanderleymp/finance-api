import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('system_features')
export class SystemFeatures {
  @Column({ nullable: false, primary: true })
  feature_id: number;

  @Column({ nullable: false, length: 100 })
  feature_name: string;

  @Column()
  feature_description: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
