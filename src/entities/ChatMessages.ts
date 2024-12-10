import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('chat_messages')
export class ChatMessages {
  @Column({ nullable: false, primary: true })
  message_id: number;

  @Column({ nullable: false })
  chat_id: number;

  @Column()
  sent_at: string;

  @Column()
  delivered_at: string;

  @Column()
  read_at: string;

  @Column({ nullable: false })
  content: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
