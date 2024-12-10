import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('person_details_view')
export class PersonDetailsView {
  @PrimaryGeneratedColumn({ nullable: true })
  person_id: number;

  @Column({ nullable: true, length: 255 })
  full_name: string;

  @Column({ nullable: true })
  birth_date: Date;

  @Column({ nullable: true, length: 255 })
  fantasy_name: string;

  @Column({ nullable: true })
  social_capital: number;

  @Column({ nullable: true })
  created_at: Date;

  @Column({ nullable: true })
  contacts: any;

  @Column({ nullable: true })
  documents: any;

  @Column({ nullable: true, length: 100 })
  street: string;

  @Column({ nullable: true, length: 20 })
  number: string;

  @Column({ nullable: true, length: 50 })
  complement: string;

  @Column({ nullable: true, length: 50 })
  neighborhood: string;

  @Column({ nullable: true, length: 50 })
  city: string;

  @Column({ nullable: true, length: 2 })
  state: string;

  @Column({ nullable: true, length: 10 })
  postal_code: string;

  @Column({ nullable: true, length: 50 })
  country: string;

  @Column({ nullable: true, length: 100 })
  reference: string;

  @Column({ nullable: true })
  ibge: number;

  @UpdateDateColumn()
  updatedAt: Date;
}