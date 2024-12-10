import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('person_documents')
export class PersonDocuments {
  @PrimaryGeneratedColumn({ default: 'nextval(person_documents_person_document_id_seq)' })
  person_document_id: number;

  @PrimaryGeneratedColumn()
  person_id: number;

  @PrimaryGeneratedColumn()
  document_type_id: number;

  @Column({ length: 50 })
  document_value: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}