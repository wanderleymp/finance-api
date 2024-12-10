import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('message_templates')
export class MessageTemplates {
  @PrimaryGeneratedColumn({ default: 'nextval(message_templates_template_id_seq)' })
  template_id: number;

  @PrimaryGeneratedColumn()
  chat_type_id: number;

  @Column()
  template_content: string;

  @Column({ nullable: true, default: new Date() })
  created_at: Date;

  @Column({ nullable: true, default: new Date() })
  updated_at: Date;

  @Column({ nullable: true })
  subject: string;
}