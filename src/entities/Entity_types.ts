import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('entity_types')
export class EntityTypes {
  @PrimaryGeneratedColumn({ default: 'nextval(entity_types_entity_type_id_seq)' })
  entity_type_id: number;

  @Column({ length: 50 })
  entity_name: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}