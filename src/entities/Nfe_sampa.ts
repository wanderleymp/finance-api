import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('nfe_sampa')
export class NfeSampa {
  @PrimaryGeneratedColumn({ default: 'nextval(nfe_sampa_nfe_sampa_id_seq)' })
  nfe_sampa_id: number;

  @Column({ nullable: true })
  chave_origem: string;

  @Column()
  json_data: any;

  @Column({ default: new Date() })
  emissao: Date;

  @Column({ nullable: true })
  json_retorno: any;

  @Column({ nullable: true })
  url_xml: string;

  @Column({ nullable: true })
  url_pdf: string;

  @Column({ nullable: true })
  status: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}