import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('movement_statuses')
export class MovementStatuses {
  @Column({ nullable: false, primary: true })
  movement_status_id: number;

  @Column({ nullable: false })
  status_category_id: number;

  @Column({ nullable: false })
  movement_type_id: number;

  @Column()
  is_final: boolean;

  @Column()
  display_order: number;

  @Column({ nullable: false, length: 50 })
  status_name: string;

  @Column()
  description: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
