import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('invoice_events')
export class InvoiceEvents {
  @Column({ nullable: false, primary: true })
  event_id: number;

  @Column({ nullable: false })
  invoice_id: number;

  @Column()
  event_date: string;

  @Column()
  event_data: any;

  @Column()
  created_at: string;

  @Column({ nullable: false, length: 50 })
  event_type: string;

  @Column({ length: 20 })
  status: string;

  @Column()
  message: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
