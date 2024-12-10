import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('person_types')
export class PersonTypes {
  @PrimaryGeneratedColumn({ default: 'nextval(person_types_person_type_id_seq)' })
  person_type_id: number;

  @Column({ length: 50 })
  description: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}