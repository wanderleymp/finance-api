import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('processes_type')
export class ProcessesType {
  @PrimaryGeneratedColumn({ default: 'nextval(processes_type_type_id_seq)' })
  type_id: number;

  @Column({ length: 50 })
  name: string;

  @Column({ nullable: true, default: false })
  is_default: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}