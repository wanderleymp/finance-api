import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('nota_fiscal_eventos')
export class NotaFiscalEventos {
  @PrimaryGeneratedColumn()
  evento_id: number;

  @PrimaryGeneratedColumn()
  nota_fiscal_id: number;

  @Column({ length: 50 })
  tipo_evento: string;

  @Column({ nullable: true, default: new Date() })
  data_evento: Date;

  @Column({ nullable: true })
  dados_evento: any;

  @Column({ nullable: true, length: 20 })
  status: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}