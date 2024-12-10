import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('vw_movement_items')
export class VwMovementItems {
  @Column()
  movement_item_id: number;

  @Column()
  movement_id: number;

  @Column()
  product_id: number;

  @Column()
  quantity: string;

  @Column()
  unit_price: string;

  @Column()
  total_price: string;

  @Column()
  salesperson_id: number;

  @Column()
  technician_id: number;

  @Column()
  product: any;

  @Column()
  salesperson: any;

  @Column()
  technician: any;

  @Column()
  description: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
