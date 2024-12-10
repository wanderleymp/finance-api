import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('invoice_events')
export class InvoiceEvents {
  @PrimaryGeneratedColumn({ default: 'nextval(invoice_events_event_id_seq)' })
  event_id: number;

  @PrimaryGeneratedColumn()
  invoice_id: number;

  @Column({ length: 50 })
  event_type: string;

  @Column({ nullable: true, default: new Date() })
  event_date: Date;

  @Column({ nullable: true })
  event_data: any;

  @Column({ nullable: true, length: 20 })
  status: string;

  @Column({ nullable: true })
  message: string;

  @Column({ nullable: true, default: new Date() })
  created_at: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}