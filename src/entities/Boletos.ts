import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('boletos')
export class Boletos {
  @PrimaryGeneratedColumn({ default: 'nextval(boletos_boleto_id_seq)' })
  boleto_id: number;

  @PrimaryGeneratedColumn()
  installment_id: number;

  @Column({ nullable: true, length: 50 })
  boleto_number: string;

  @Column({ nullable: true, length: 255 })
  boleto_url: string;

  @Column({ nullable: true, default: new Date() })
  generated_at: Date;

  @Column({ nullable: true, length: 20 })
  status: string;

  @Column({ nullable: true, length: 255 })
  codigo_barras: string;

  @Column({ nullable: true, length: 255 })
  linha_digitavel: string;

  @Column({ nullable: true, length: 1024 })
  pix_copia_e_cola: string;

  @Column({ nullable: true, default: new Date() })
  last_status_update: Date;

  @PrimaryGeneratedColumn({ nullable: true, length: 255 })
  external_boleto_id: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}