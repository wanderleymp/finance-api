import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('model.vw_schema_overview')
export class Model.vwSchemaOverview {
  @Column()
  object_type: string;

  @Column()
  schema_name: string;

  @Column()
  object_name: string;

  @Column()
  details: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
