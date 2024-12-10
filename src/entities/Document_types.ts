import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('document_types')
export class DocumentTypes {
  @PrimaryGeneratedColumn({ default: 'nextval(document_types_document_type_id_seq)' })
  document_type_id: number;

  @Column({ length: 50 })
  description: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}