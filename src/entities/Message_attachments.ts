import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('message_attachments')
export class MessageAttachments {
  @PrimaryGeneratedColumn({ default: 'nextval(message_attachments_attachment_id_seq)' })
  attachment_id: number;

  @PrimaryGeneratedColumn()
  message_id: number;

  @Column({ length: 255 })
  file_path: string;

  @Column({ nullable: true, length: 50 })
  file_type: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}