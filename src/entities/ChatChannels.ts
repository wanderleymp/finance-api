import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('chat_channels')
export class ChatChannels {
  @Column({ nullable: false, primary: true })
  channel_id: number;

  @Column()
  created_at: string;

  @Column()
  updated_at: string;

  @Column({ nullable: false, length: 50 })
  channel_name: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
