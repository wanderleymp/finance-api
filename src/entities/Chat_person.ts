import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('chat_person')
export class ChatPerson {
  @PrimaryGeneratedColumn()
  chat_id: number;

  @PrimaryGeneratedColumn()
  contact_id: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}