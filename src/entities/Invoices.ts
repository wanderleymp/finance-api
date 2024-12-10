import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('invoices')
export class Invoices {
  @PrimaryGeneratedColumn({ default: 'nextval(invoices_invoice_id_seq)' })
  invoice_id: number;

  @PrimaryGeneratedColumn({ length: 100 })
  reference_id: string;

  @Column({ length: 10 })
  type: string;

  @Column({ nullable: true, length: 50 })
  number: string;

  @Column({ nullable: true, length: 20 })
  series: string;

  @Column({ nullable: true, length: 20 })
  status: string;

  @Column({ nullable: true, length: 20 })
  environment: string;

  @Column({ nullable: true })
  pdf_url: string;

  @Column({ nullable: true })
  xml_url: string;

  @Column({ nullable: true, default: new Date() })
  created_at: Date;

  @Column({ nullable: true, default: new Date() })
  updated_at: Date;

  @PrimaryGeneratedColumn({ nullable: true })
  movement_id: number;

  @PrimaryGeneratedColumn({ nullable: true, default: 10 })
  integration_id: number;

  @PrimaryGeneratedColumn({ nullable: true })
  emitente_person_id: number;

  @PrimaryGeneratedColumn({ nullable: true })
  destinatario_person_id: number;

  @Column({ nullable: true })
  total_amount: number;
}