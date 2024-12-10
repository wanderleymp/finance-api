import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('vw_persons_complete')
export class VwPersonsComplete {
  @PrimaryGeneratedColumn({ nullable: true })
  person_id: number;

  @Column({ nullable: true, length: 255 })
  full_name: string;

  @Column({ nullable: true })
  birth_date: Date;

  @Column({ nullable: true })
  created_at: Date;

  @Column({ nullable: true, length: 255 })
  fantasy_name: string;

  @Column({ nullable: true })
  social_capital: number;

  @Column({ nullable: true, length: 50 })
  person_type_description: string;

  @Column({ nullable: true })
  contacts: any;

  @Column({ nullable: true })
  documents: any;

  @Column({ nullable: true })
  pix_keys: any;

  @Column({ nullable: true })
  tax_regimes: any;

  @Column({ nullable: true })
  licenses: any;

  @Column({ nullable: true })
  qsa: any;

  @Column({ nullable: true })
  cnae: any;

  @UpdateDateColumn()
  updatedAt: Date;
}