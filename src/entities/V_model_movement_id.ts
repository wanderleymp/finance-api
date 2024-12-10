import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('v_model_movement_id')
export class VModelMovementId {
  @PrimaryGeneratedColumn({ nullable: true })
  model_movement_id: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}