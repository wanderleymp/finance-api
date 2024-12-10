import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('movement_status')
export class MovementStatus {
  @PrimaryGeneratedColumn({ default: 'nextval(movement_status_status_id_seq)' })
  status_id: number;

  @Column({ length: 50 })
  status_name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true, default: false })
  is_final: boolean;

  @Column({ nullable: true, default: new Date() })
  created_at: Date;

  @Column({ nullable: true })
  order: number;

  @UpdateDateColumn()
  updatedAt: Date;
}