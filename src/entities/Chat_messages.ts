import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('chat_messages')
export class ChatMessages {
  @PrimaryGeneratedColumn()
  message_id: number;

  @PrimaryGeneratedColumn()
  chat_id: number;

  @Column()
  content: string;

  @Column({ nullable: true, default: new Date() })
  sent_at: Date;

  @Column({ nullable: true })
  delivered_at: Date;

  @Column({ nullable: true })
  read_at: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}