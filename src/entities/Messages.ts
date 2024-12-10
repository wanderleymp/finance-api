import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('messages')
export class Messages {
  @PrimaryGeneratedColumn({ default: 'nextval(messages_message_id_seq)' })
  message_id: number;

  @PrimaryGeneratedColumn()
  chat_id: number;

  @PrimaryGeneratedColumn({ nullable: true })
  sender_id: number;

  @PrimaryGeneratedColumn({ nullable: true })
  receiver_id: number;

  @Column()
  message_content: string;

  @Column({ nullable: true, length: 50, default: 'pending' })
  message_status: string;

  @Column({ nullable: true, default: new Date() })
  created_at: Date;

  @Column({ nullable: true, default: new Date() })
  updated_at: Date;
}