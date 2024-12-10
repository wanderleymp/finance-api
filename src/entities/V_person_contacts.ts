import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('v_person_contacts')
export class VPersonContacts {
  @PrimaryGeneratedColumn({ nullable: true })
  person_id: number;

  @PrimaryGeneratedColumn({ nullable: true })
  contact_type_id: number;

  @Column({ nullable: true, length: 50 })
  contact_type: string;

  @PrimaryGeneratedColumn({ nullable: true })
  group_id: number;

  @Column({ nullable: true, length: 255 })
  group_name: string;

  @Column({ nullable: true })
  contacts_json: any;

  @Column({ nullable: true, length: 255 })
  full_name: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}