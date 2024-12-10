import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('person_tax_regimes')
export class PersonTaxRegimes {
  @PrimaryGeneratedColumn()
  person_id: number;

  @PrimaryGeneratedColumn()
  tax_regime_id: number;

  @Column({ nullable: true })
  start_date: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}