import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('boleto_webhook_responses')
export class BoletoWebhookResponses {
  @Column({ nullable: false, primary: true })
  webhook_id: number;

  @Column()
  boleto_id: number;

  @Column({ nullable: false })
  webhook_data: any;

  @Column()
  received_at: string;

  @Column()
  processed_at: string;

  @Column({ length: 50 })
  external_boleto_id: string;

  @Column({ length: 20 })
  processed_status: string;

  @Column()
  error_message: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
