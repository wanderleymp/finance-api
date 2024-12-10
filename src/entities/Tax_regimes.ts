import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('tax_regimes')
export class TaxRegimes {
  @PrimaryGeneratedColumn({ default: 'nextval(tax_regimes_tax_regime_id_seq)' })
  tax_regime_id: number;

  @Column({ length: 100 })
  description: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}