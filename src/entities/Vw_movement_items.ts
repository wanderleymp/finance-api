import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('vw_movement_items')
export class VwMovementItems {
  @PrimaryGeneratedColumn({ nullable: true })
  movement_item_id: number;

  @PrimaryGeneratedColumn({ nullable: true })
  movement_id: number;

  @PrimaryGeneratedColumn({ nullable: true })
  product_id: number;

  @Column({ nullable: true })
  quantity: number;

  @Column({ nullable: true })
  unit_price: number;

  @Column({ nullable: true })
  total_price: number;

  @PrimaryGeneratedColumn({ nullable: true })
  salesperson_id: number;

  @PrimaryGeneratedColumn({ nullable: true })
  technician_id: number;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  product: any;

  @Column({ nullable: true })
  salesperson: any;

  @Column({ nullable: true })
  technician: any;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}