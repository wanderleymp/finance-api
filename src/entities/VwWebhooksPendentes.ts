import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('vw_webhooks_pendentes')
export class VwWebhooksPendentes {
  @Column()
  webhook_id: number;

  @Column()
  boleto_id: number;

  @Column()
  webhook_data: any;

  @Column()
  received_at: string;

  @Column()
  installment_id: number;

  @Column()
  last_status_update: string;

  @Column()
  installment_payment_id: number;

  @Column({ length: 20 })
  processed_status: string;

  @Column({ length: 255 })
  external_boleto_id: string;

  @Column({ length: 20 })
  boleto_status: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
