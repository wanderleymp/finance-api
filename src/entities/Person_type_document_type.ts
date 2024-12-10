import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('person_type_document_type')
export class PersonTypeDocumentType {
  @PrimaryGeneratedColumn()
  person_type_id: number;

  @PrimaryGeneratedColumn()
  document_type_id: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}