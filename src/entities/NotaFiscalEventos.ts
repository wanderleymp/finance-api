import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('nota_fiscal_eventos')
export class NotaFiscalEventos {
  @Column({ nullable: false, primary: true })
  evento_id: number;

  @Column({ nullable: false })
  nota_fiscal_id: number;

  @Column()
  data_evento: string;

  @Column()
  dados_evento: any;

  @Column({ nullable: false, length: 50 })
  tipo_evento: string;

  @Column({ length: 20 })
  status: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
