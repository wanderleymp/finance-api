import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('message_channels')
export class MessageChannels {
  @Column({ nullable: false, primary: true })
  channel_id: number;

  @Column({ nullable: false, length: 50 })
  channel_name: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
