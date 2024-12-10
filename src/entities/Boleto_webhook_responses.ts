import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('boleto_webhook_responses')
export class BoletoWebhookResponses {
  @PrimaryGeneratedColumn({ default: 'nextval(boleto_webhook_responses_webhook_id_seq)' })
  webhook_id: number;

  @PrimaryGeneratedColumn({ nullable: true })
  boleto_id: number;

  @PrimaryGeneratedColumn({ nullable: true, length: 50 })
  external_boleto_id: string;

  @Column()
  webhook_data: any;

  @Column({ nullable: true, length: 20, default: 'Pendente' })
  processed_status: string;

  @Column({ nullable: true, default: new Date() })
  received_at: Date;

  @Column({ nullable: true })
  processed_at: Date;

  @Column({ nullable: true })
  error_message: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}