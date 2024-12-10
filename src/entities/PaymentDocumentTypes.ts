import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('payment_document_types')
export class PaymentDocumentTypes {
  @Column({ nullable: false, primary: true })
  document_type_id: number;

  @Column({ nullable: false, length: 50 })
  document_name: string;

  @Column()
  description: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
