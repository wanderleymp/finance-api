import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('persons')
export class Persons {
  @PrimaryGeneratedColumn({ default: 'nextval(persons_person_id_seq)' })
  person_id: number;

  @Column({ length: 255 })
  full_name: string;

  @Column({ nullable: true })
  birth_date: Date;

  @PrimaryGeneratedColumn({ nullable: true })
  person_type_id: number;

  @Column({ nullable: true, default: new Date() })
  created_at: Date;

  @Column({ nullable: true, length: 255 })
  fantasy_name: string;

  @Column({ nullable: true })
  social_capital: number;

  @Column({ nullable: true, default: new Date() })
  updated_at: Date;
}