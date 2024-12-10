import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('vw_persons_complete')
export class VwPersonsComplete {
  @Column()
  person_id: number;

  @Column()
  birth_date: Date;

  @Column()
  created_at: string;

  @Column()
  social_capital: string;

  @Column()
  contacts: any;

  @Column()
  documents: any;

  @Column()
  pix_keys: any;

  @Column()
  tax_regimes: any;

  @Column()
  licenses: any;

  @Column()
  qsa: any;

  @Column()
  cnae: any;

  @Column({ length: 255 })
  full_name: string;

  @Column({ length: 255 })
  fantasy_name: string;

  @Column({ length: 50 })
  person_type_description: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
