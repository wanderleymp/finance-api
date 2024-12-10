import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('person_types')
export class PersonTypes {
  @Column({ nullable: false, primary: true })
  person_type_id: number;

  @Column({ nullable: false, length: 50 })
  description: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
