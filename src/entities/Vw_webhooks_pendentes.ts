import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('vw_webhooks_pendentes')
export class VwWebhooksPendentes {
  @PrimaryGeneratedColumn({ nullable: true })
  webhook_id: number;

  @PrimaryGeneratedColumn({ nullable: true })
  boleto_id: number;

  @Column({ nullable: true })
  webhook_data: any;

  @Column({ nullable: true, length: 20 })
  processed_status: string;

  @Column({ nullable: true })
  received_at: Date;

  @PrimaryGeneratedColumn({ nullable: true })
  installment_id: number;

  @PrimaryGeneratedColumn({ nullable: true, length: 255 })
  external_boleto_id: string;

  @Column({ nullable: true, length: 20 })
  boleto_status: string;

  @Column({ nullable: true })
  last_status_update: Date;

  @PrimaryGeneratedColumn({ nullable: true })
  installment_payment_id: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}