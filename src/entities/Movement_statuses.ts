import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('movement_statuses')
export class MovementStatuses {
  @PrimaryGeneratedColumn({ default: 'nextval(movement_statuses_movement_status_id_seq)' })
  movement_status_id: number;

  @Column({ length: 50 })
  status_name: string;

  @Column({ nullable: true })
  description: string;

  @PrimaryGeneratedColumn()
  status_category_id: number;

  @PrimaryGeneratedColumn()
  movement_type_id: number;

  @Column({ nullable: true, default: false })
  is_final: boolean;

  @Column({ nullable: true })
  display_order: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}