import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('nfe_sampa')
export class NfeSampa {
  @Column({ nullable: false, primary: true })
  nfe_sampa_id: number;

  @Column({ nullable: false })
  json_data: any;

  @Column({ nullable: false })
  emissao: string;

  @Column()
  json_retorno: any;

  @Column()
  chave_origem: string;

  @Column()
  url_xml: string;

  @Column()
  url_pdf: string;

  @Column()
  status: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
