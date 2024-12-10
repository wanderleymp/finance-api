import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('v_person_contacts')
export class VPersonContacts {
  @Column()
  person_id: number;

  @Column()
  contact_type_id: number;

  @Column()
  group_id: number;

  @Column()
  contacts_json: any;

  @Column({ length: 50 })
  contact_type: string;

  @Column({ length: 255 })
  group_name: string;

  @Column({ length: 255 })
  full_name: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
