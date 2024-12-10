import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('contact_types')
export class ContactTypes {
  @PrimaryGeneratedColumn({ default: 'nextval(contact_types_contact_type_id_seq)' })
  contact_type_id: number;

  @Column({ length: 50 })
  description: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}