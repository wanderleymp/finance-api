import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('movements')
export class Movements {
  @PrimaryGeneratedColumn()
  movement_id: number;

  @Column()
  movement_date: Date;

  @PrimaryGeneratedColumn()
  person_id: number;

  @Column()
  total_amount: number;

  @PrimaryGeneratedColumn()
  license_id: number;

  @Column({ nullable: true, default: new Date() })
  created_at: Date;

  @Column({ nullable: true, default: 0.00 })
  discount: number;

  @Column({ nullable: true, default: 0.00 })
  addition: number;

  @Column({ nullable: true, default: 0.00 })
  total_items: number;

  @PrimaryGeneratedColumn({ nullable: true })
  payment_method_id: number;

  @Column({ nullable: true })
  description: string;

  @PrimaryGeneratedColumn({ nullable: true })
  movement_type_id: number;

  @PrimaryGeneratedColumn({ nullable: true })
  movement_status_id: number;

  @Column({ nullable: true, default: false })
  is_template: boolean;

  @UpdateDateColumn()
  updatedAt: Date;
}