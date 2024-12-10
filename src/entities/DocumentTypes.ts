import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('document_types')
export class DocumentTypes {
  @Column({ nullable: false, primary: true })
  document_type_id: number;

  @Column({ nullable: false, length: 50 })
  description: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
