import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('processes')
export class Processes {
  @PrimaryGeneratedColumn({ default: 'nextval(processes_process_id_seq)' })
  process_id: number;

  @Column({ length: 255 })
  name: string;

  @Column({ nullable: true })
  description: string;

  @PrimaryGeneratedColumn()
  type_id: number;

  @PrimaryGeneratedColumn()
  status_id: number;

  @PrimaryGeneratedColumn()
  start_mode_id: number;

  @Column({ nullable: true, default: new Date() })
  created_at: Date;

  @Column({ nullable: true, default: new Date() })
  updated_at: Date;
}