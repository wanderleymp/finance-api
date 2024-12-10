import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('vw_movement_template')
export class VwMovementTemplate {
  @Column({ nullable: true, length: 255 })
  full_name: string;

  @Column({ nullable: true, length: 255 })
  name: string;

  @Column({ nullable: true, length: 50 })
  method_name: string;

  @Column({ nullable: true })
  first_due_date_days: number;

  @PrimaryGeneratedColumn({ nullable: true })
  template_id: number;

  @Column({ nullable: true, length: 255 })
  template_name: string;

  @Column({ nullable: true, length: 50 })
  movement_type: string;

  @PrimaryGeneratedColumn({ nullable: true })
  person_id: number;

  @PrimaryGeneratedColumn({ nullable: true })
  license_id: number;

  @PrimaryGeneratedColumn({ nullable: true })
  payment_method_id: number;

  @Column({ nullable: true })
  total_value: number;

  @Column({ nullable: true })
  created_at: Date;

  @Column({ nullable: true })
  updated_at: Date;

  @Column({ nullable: true })
  generate_nfse: boolean;

  @Column({ nullable: true })
  generate_boleto: boolean;

  @Column({ nullable: true })
  default_discount: number;

  @Column({ nullable: true })
  default_addition: number;

  @Column({ nullable: true })
  active: boolean;

  @PrimaryGeneratedColumn({ nullable: true })
  service_id: number;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true, length: 100 })
  license_name: string;
}