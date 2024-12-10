import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('person_documents')
export class PersonDocuments {
  @Column({ nullable: false, primary: true })
  person_document_id: number;

  @Column({ nullable: false })
  person_id: number;

  @Column({ nullable: false })
  document_type_id: number;

  @Column({ nullable: false, length: 50 })
  document_value: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
