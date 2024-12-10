import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('movement_status_history')
export class MovementStatusHistory {
  @PrimaryGeneratedColumn({ default: 'nextval(movement_status_history_history_id_seq)' })
  history_id: number;

  @PrimaryGeneratedColumn()
  movement_id: number;

  @PrimaryGeneratedColumn()
  movement_status_id: number;

  @Column({ nullable: true, default: new Date() })
  changed_at: string;

  @Column({ nullable: true, length: 255 })
  changed_by: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}