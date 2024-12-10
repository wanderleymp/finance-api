import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('processes_status')
export class ProcessesStatus {
  @Column({ nullable: false, primary: true })
  status_id: number;

  @Column()
  is_default: boolean;

  @Column({ nullable: false, length: 50 })
  name: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
