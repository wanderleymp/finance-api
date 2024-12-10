import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('n8n_chat_histories')
export class N8nChatHistories {
  @PrimaryGeneratedColumn({ default: 'nextval(n8n_chat_histories_id_seq)' })
  id: number;

  @PrimaryGeneratedColumn({ length: 255 })
  session_id: string;

  @Column()
  message: any;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}