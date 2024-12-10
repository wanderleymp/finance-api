import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('nfse')
export class Nfse {
  @PrimaryGeneratedColumn({ default: 'nextval(nfse_nfse_id_seq)' })
  nfse_id: number;

  @PrimaryGeneratedColumn()
  invoice_id: number;

  @PrimaryGeneratedColumn({ nullable: true, length: 100 })
  integration_nfse_id: string;

  @Column({ nullable: true })
  service_value: number;

  @Column({ nullable: true })
  iss_value: number;

  @Column({ nullable: true })
  aliquota_service: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}