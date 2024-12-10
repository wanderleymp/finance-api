import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('processes_start_mode')
export class ProcessesStartMode {
  @PrimaryGeneratedColumn({ default: 'nextval(processes_start_mode_start_mode_id_seq)' })
  start_mode_id: number;

  @Column({ length: 50 })
  name: string;

  @Column({ nullable: true, default: false })
  is_default: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}