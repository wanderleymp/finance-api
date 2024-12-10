import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('movement_items')
export class MovementItems {
  @PrimaryGeneratedColumn()
  movement_item_id: number;

  @PrimaryGeneratedColumn()
  movement_id: number;

  @PrimaryGeneratedColumn()
  item_id: number;

  @Column()
  quantity: number;

  @Column()
  unit_price: number;

  @Column()
  total_price: number;

  @PrimaryGeneratedColumn({ nullable: true })
  salesperson_id: number;

  @PrimaryGeneratedColumn({ nullable: true })
  technician_id: number;

  @Column({ nullable: true })
  description: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}