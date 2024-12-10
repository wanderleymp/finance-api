import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('message_channels')
export class MessageChannels {
  @PrimaryGeneratedColumn({ default: 'nextval(message_channels_channel_id_seq)' })
  channel_id: number;

  @Column({ length: 50 })
  channel_name: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}