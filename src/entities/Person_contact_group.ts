import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('person_contact_group')
export class PersonContactGroup {
  @PrimaryGeneratedColumn({ default: 'nextval(person_contact_group_group_id_seq)' })
  group_id: number;

  @Column({ length: 255 })
  group_name: string;

  @Column({ nullable: true, default: new Date() })
  created_at: Date;

  @Column({ nullable: true, default: new Date() })
  updated_at: Date;
}