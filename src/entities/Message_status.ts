import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('message_status')
export class MessageStatus {
  @PrimaryGeneratedColumn({ default: 'nextval(message_status_status_id_seq)' })
  status_id: number;

  @Column({ length: 50 })
  status_name: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}