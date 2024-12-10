import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('system_features')
export class SystemFeatures {
  @PrimaryGeneratedColumn({ default: 'nextval(system_features_feature_id_seq)' })
  feature_id: number;

  @Column({ length: 100 })
  feature_name: string;

  @Column({ nullable: true })
  feature_description: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}