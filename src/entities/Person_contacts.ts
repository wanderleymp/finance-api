import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('person_contacts')
export class PersonContacts {
  @PrimaryGeneratedColumn()
  person_id: number;

  @PrimaryGeneratedColumn()
  contact_id: number;

  @PrimaryGeneratedColumn()
  person_contact_id: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}