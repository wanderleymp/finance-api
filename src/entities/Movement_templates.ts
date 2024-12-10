import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('movement_templates')
export class MovementTemplates {
  @PrimaryGeneratedColumn({ default: 'nextval(movement_templates_template_id_seq)' })
  template_id: number;

  @Column({ length: 255 })
  template_name: string;

  @Column({ length: 50 })
  movement_type: string;

  @PrimaryGeneratedColumn({ nullable: true })
  person_id: number;

  @PrimaryGeneratedColumn({ default: 1 })
  license_id: number;

  @PrimaryGeneratedColumn({ nullable: true })
  payment_method_id: number;

  @Column({ nullable: true, default: 0.00 })
  total_value: number;

  @Column({ nullable: true, default: new Date() })
  created_at: Date;

  @Column({ nullable: true, default: new Date() })
  updated_at: Date;

  @Column({ nullable: true, default: false })
  generate_nfse: boolean;

  @Column({ nullable: true, default: false })
  generate_boleto: boolean;

  @Column({ nullable: true, default: 0.00 })
  default_discount: number;

  @Column({ nullable: true, default: 0.00 })
  default_addition: number;

  @Column({ nullable: true, default: true })
  active: boolean;

  @PrimaryGeneratedColumn({ default: 1 })
  service_id: number;

  @Column({ nullable: true })
  movement_date: Date;

  @Column({ nullable: true })
  vencimento_date: Date;

  @Column({ nullable: true, default: true })
  notifica: boolean;

  @Column({ nullable: true })
  description: string;
}