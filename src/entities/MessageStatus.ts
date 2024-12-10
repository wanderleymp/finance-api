import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('message_status')
export class MessageStatus {
  @Column({ nullable: false, primary: true })
  status_id: number;

  @Column({ nullable: false, length: 50 })
  status_name: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
