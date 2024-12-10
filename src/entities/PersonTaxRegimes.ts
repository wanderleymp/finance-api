import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('person_tax_regimes')
export class PersonTaxRegimes {
  @Column({ nullable: false, primary: true })
  person_id: number;

  @Column({ nullable: false, primary: true })
  tax_regime_id: number;

  @Column()
  start_date: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
