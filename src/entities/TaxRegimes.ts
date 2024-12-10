import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('tax_regimes')
export class TaxRegimes {
  @Column({ nullable: false, primary: true })
  tax_regime_id: number;

  @Column({ nullable: false, length: 100 })
  description: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
