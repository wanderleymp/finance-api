import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('person_contacts')
export class PersonContacts {
  @Column({ nullable: false })
  person_id: number;

  @Column({ nullable: false })
  contact_id: number;

  @Column({ nullable: false })
  person_contact_id: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
