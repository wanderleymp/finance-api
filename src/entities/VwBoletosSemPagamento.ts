import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('vw_boletos_sem_pagamento')
export class VwBoletosSemPagamento {
  @Column()
  webhook_id: number;

  @Column()
  boleto_id: number;

  @Column()
  installment_id: number;

  @Column()
  last_status_update: string;

  @Column({ length: 255 })
  external_boleto_id: string;

  @Column({ length: 20 })
  boleto_status: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
