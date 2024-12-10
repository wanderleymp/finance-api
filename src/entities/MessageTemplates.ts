import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('message_templates')
export class MessageTemplates {
  @Column({ nullable: false, primary: true })
  template_id: number;

  @Column({ nullable: false })
  chat_type_id: number;

  @Column()
  created_at: string;

  @Column()
  updated_at: string;

  @Column({ nullable: false })
  template_content: string;

  @Column()
  subject: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
