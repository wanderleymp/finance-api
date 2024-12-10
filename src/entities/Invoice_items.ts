import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('invoice_items')
export class InvoiceItems {
  @PrimaryGeneratedColumn({ default: 'nextval(invoice_items_item_id_seq)' })
  item_id: number;

  @PrimaryGeneratedColumn()
  invoice_id: number;

  @Column()
  description: string;

  @Column({ nullable: true })
  quantity: number;

  @Column({ nullable: true })
  unit_price: number;

  @Column({ nullable: true })
  total_price: number;

  @Column({ nullable: true, length: 10 })
  cfop: string;

  @Column({ nullable: true, length: 10 })
  cst: string;

  @Column({ nullable: true })
  aliquota: number;

  @Column({ nullable: true })
  icms_base: number;

  @Column({ nullable: true })
  icms_value: number;

  @Column({ nullable: true, length: 20 })
  service_code: string;

  @Column({ nullable: true, length: 10 })
  municipio_code: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}