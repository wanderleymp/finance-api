import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('nfce')
export class Nfce {
  @PrimaryGeneratedColumn({ default: 'nextval(nfce_nfce_id_seq)' })
  nfce_id: number;

  @PrimaryGeneratedColumn()
  invoice_id: number;

  @Column({ nullable: true })
  qr_code: string;

  @Column({ nullable: true, length: 20 })
  consumer_cpf_cnpj: string;

  @Column({ nullable: true, length: 100 })
  consumer_name: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}