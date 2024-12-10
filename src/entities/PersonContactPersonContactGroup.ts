import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('person_contact_person_contact_group')
export class PersonContactPersonContactGroup {
  @Column({ nullable: false, primary: true })
  person_contact_id: number;

  @Column({ nullable: false, primary: true })
  group_id: number;

  @Column()
  created_at: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
