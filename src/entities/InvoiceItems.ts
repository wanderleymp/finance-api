import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('invoice_items')
export class InvoiceItems {
  @Column({ nullable: false, primary: true })
  item_id: number;

  @Column({ nullable: false })
  invoice_id: number;

  @Column()
  quantity: string;

  @Column()
  unit_price: string;

  @Column()
  total_price: string;

  @Column()
  aliquota: string;

  @Column()
  icms_base: string;

  @Column()
  icms_value: string;

  @Column({ nullable: false })
  description: string;

  @Column({ length: 10 })
  cfop: string;

  @Column({ length: 10 })
  cst: string;

  @Column({ length: 20 })
  service_code: string;

  @Column({ length: 10 })
  municipio_code: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
