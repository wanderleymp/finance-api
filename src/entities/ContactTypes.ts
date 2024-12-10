import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('contact_types')
export class ContactTypes {
  @Column({ nullable: false, primary: true })
  contact_type_id: number;

  @Column({ nullable: false, length: 50 })
  description: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
