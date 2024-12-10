import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('processes_types')
export class ProcessesTypes {
  @PrimaryGeneratedColumn({ default: 'nextval(processes_types_process_type_id_seq)' })
  process_type_id: number;

  @Column({ length: 255 })
  process_name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true, default: true })
  is_standard: boolean;

  @Column({ nullable: true, default: new Date() })
  created_at: Date;

  @Column({ nullable: true, default: new Date() })
  updated_at: Date;
}