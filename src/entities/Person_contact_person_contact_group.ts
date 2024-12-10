import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('person_contact_person_contact_group')
export class PersonContactPersonContactGroup {
  @PrimaryGeneratedColumn()
  person_contact_id: number;

  @PrimaryGeneratedColumn()
  group_id: number;

  @Column({ nullable: true, default: new Date() })
  created_at: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}