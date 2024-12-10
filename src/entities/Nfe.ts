import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('nfe')
export class Nfe {
  @PrimaryGeneratedColumn({ default: 'nextval(nfe_nfe_id_seq)' })
  nfe_id: number;

  @PrimaryGeneratedColumn()
  invoice_id: number;

  @Column({ nullable: true, length: 44 })
  access_key: string;

  @Column({ nullable: true })
  freight_value: number;

  @Column({ nullable: true })
  insurance_value: number;

  @Column({ nullable: true, default: false })
  icms_exemption: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}