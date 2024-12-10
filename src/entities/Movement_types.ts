import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('movement_types')
export class MovementTypes {
  @PrimaryGeneratedColumn({ default: 'nextval(movement_types_movement_type_id_seq)' })
  movement_type_id: number;

  @Column({ length: 50 })
  type_name: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}