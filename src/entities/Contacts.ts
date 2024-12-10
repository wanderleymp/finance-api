import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('contacts')
export class Contacts {
  @PrimaryGeneratedColumn({ default: 'nextval(contacts_contact_id_seq)' })
  contact_id: number;

  @PrimaryGeneratedColumn()
  contact_type_id: number;

  @Column({ length: 100 })
  contact_value: string;

  @Column({ nullable: true, length: 150 })
  contact_name: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}