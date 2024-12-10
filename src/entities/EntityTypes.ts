import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('entity_types')
export class EntityTypes {
  @Column({ nullable: false, primary: true })
  entity_type_id: number;

  @Column({ nullable: false, length: 50 })
  entity_name: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
