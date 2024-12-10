import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('n8n_chat_histories')
export class N8nChatHistories {
  @Column({ nullable: false, primary: true })
  id: number;

  @Column({ nullable: false })
  message: any;

  @Column({ nullable: false, length: 255 })
  session_id: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
