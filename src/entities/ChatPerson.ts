import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('chat_person')
export class ChatPerson {
  @Column({ nullable: false, primary: true })
  chat_id: number;

  @Column({ nullable: false, primary: true })
  contact_id: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
