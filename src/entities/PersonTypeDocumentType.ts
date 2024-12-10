import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('person_type_document_type')
export class PersonTypeDocumentType {
  @Column({ nullable: false, primary: true })
  person_type_id: number;

  @Column({ nullable: false, primary: true })
  document_type_id: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
