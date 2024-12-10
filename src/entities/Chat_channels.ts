import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('chat_channels')
export class ChatChannels {
  @PrimaryGeneratedColumn({ default: 'nextval(chat_channels_channel_id_seq)' })
  channel_id: number;

  @Column({ length: 50 })
  channel_name: string;

  @Column({ nullable: true, default: new Date() })
  created_at: Date;

  @Column({ nullable: true, default: new Date() })
  updated_at: Date;
}