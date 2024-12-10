import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('payment_document_types')
export class PaymentDocumentTypes {
  @PrimaryGeneratedColumn()
  document_type_id: number;

  @Column({ length: 50 })
  document_name: string;

  @Column({ nullable: true })
  description: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}