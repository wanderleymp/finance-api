import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('processes_type')
export class ProcessesType {
  @Column({ nullable: false, primary: true })
  type_id: number;

  @Column()
  is_default: boolean;

  @Column({ nullable: false, length: 50 })
  name: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
