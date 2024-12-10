import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('movement_items')
export class MovementItems {
  @Column({ nullable: false, primary: true })
  movement_item_id: number;

  @Column({ nullable: false })
  movement_id: number;

  @Column({ nullable: false })
  item_id: number;

  @Column({ nullable: false })
  quantity: string;

  @Column({ nullable: false })
  unit_price: string;

  @Column({ nullable: false })
  total_price: string;

  @Column()
  salesperson_id: number;

  @Column()
  technician_id: number;

  @Column()
  description: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
