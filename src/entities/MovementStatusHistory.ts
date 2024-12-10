import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('movement_status_history')
export class MovementStatusHistory {
  @Column({ nullable: false, primary: true })
  history_id: number;

  @Column({ nullable: false })
  movement_id: number;

  @Column({ nullable: false })
  movement_status_id: number;

  @Column()
  changed_at: string;

  @Column({ length: 255 })
  changed_by: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
