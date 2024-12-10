import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('movement_status')
export class MovementStatus {
  @Column({ nullable: false, primary: true })
  status_id: number;

  @Column()
  is_final: boolean;

  @Column()
  created_at: string;

  @Column()
  order: number;

  @Column({ nullable: false, length: 50 })
  status_name: string;

  @Column()
  description: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
