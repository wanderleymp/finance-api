import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('vw_schema_overview')
export class VwSchemaOverview {
  @Column({ nullable: true })
  object_type: string;

  @Column({ nullable: true })
  schema_name: string;

  @Column({ nullable: true })
  object_name: string;

  @Column({ nullable: true })
  details: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}