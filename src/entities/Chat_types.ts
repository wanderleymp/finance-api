import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('chat_types')
export class ChatTypes {
  @PrimaryGeneratedColumn({ default: 'nextval(chat_types_chat_type_id_seq)' })
  chat_type_id: number;

  @Column({ length: 100 })
  description: string;

  @Column({ nullable: true, length: 50 })
  category: string;

  @Column({ nullable: true, default: new Date() })
  created_at: Date;

  @Column({ nullable: true, default: new Date() })
  updated_at: Date;
}