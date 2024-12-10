import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('vw_movements')
export class VwMovements {
  @PrimaryGeneratedColumn({ nullable: true })
  movement_id: number;

  @Column({ nullable: true })
  movement_date: Date;

  @PrimaryGeneratedColumn({ nullable: true })
  movement_status_id: number;

  @PrimaryGeneratedColumn({ nullable: true })
  movement_type_id: number;

  @Column({ nullable: true, length: 255 })
  full_name: string;

  @Column({ nullable: true, length: 50 })
  type_name: string;

  @Column({ nullable: true, length: 50 })
  status_name: string;

  @Column({ nullable: true })
  total_amount: number;

  @Column({ nullable: true })
  description: string;

  @PrimaryGeneratedColumn({ nullable: true })
  person_id: number;

  @Column({ nullable: true })
  installments_json: any;

  @Column({ nullable: true })
  boletos_json: any;

  @Column({ nullable: true })
  invoices_json: any;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}