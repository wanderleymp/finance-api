import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('person_details_view')
export class PersonDetailsView {
  @Column()
  person_id: number;

  @Column()
  birth_date: Date;

  @Column()
  social_capital: string;

  @Column()
  created_at: string;

  @Column()
  contacts: any;

  @Column()
  documents: any;

  @Column()
  ibge: number;

  @Column({ length: 255 })
  full_name: string;

  @Column({ length: 255 })
  fantasy_name: string;

  @Column({ length: 100 })
  street: string;

  @Column({ length: 20 })
  number: string;

  @Column({ length: 50 })
  complement: string;

  @Column({ length: 50 })
  neighborhood: string;

  @Column({ length: 50 })
  city: string;

  @Column({ length: 2 })
  state: string;

  @Column({ length: 10 })
  postal_code: string;

  @Column({ length: 50 })
  country: string;

  @Column({ length: 100 })
  reference: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
