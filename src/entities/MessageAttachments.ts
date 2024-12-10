import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('message_attachments')
export class MessageAttachments {
  @Column({ nullable: false, primary: true })
  attachment_id: number;

  @Column({ nullable: false })
  message_id: number;

  @Column({ nullable: false, length: 255 })
  file_path: string;

  @Column({ length: 50 })
  file_type: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
