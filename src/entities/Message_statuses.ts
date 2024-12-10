import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('message_statuses')
export class MessageStatuses {
  @PrimaryGeneratedColumn()
  status_id: number;

  @Column({ length: 50 })
  status_name: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}