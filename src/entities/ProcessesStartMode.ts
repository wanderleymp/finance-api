import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('processes_start_mode')
export class ProcessesStartMode {
  @Column({ nullable: false, primary: true })
  start_mode_id: number;

  @Column()
  is_default: boolean;

  @Column({ nullable: false, length: 50 })
  name: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
