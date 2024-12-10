import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('vw_boletos_sem_pagamento')
export class VwBoletosSemPagamento {
  @PrimaryGeneratedColumn({ nullable: true })
  webhook_id: number;

  @PrimaryGeneratedColumn({ nullable: true })
  boleto_id: number;

  @PrimaryGeneratedColumn({ nullable: true })
  installment_id: number;

  @PrimaryGeneratedColumn({ nullable: true, length: 255 })
  external_boleto_id: string;

  @Column({ nullable: true, length: 20 })
  boleto_status: string;

  @Column({ nullable: true })
  last_status_update: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}