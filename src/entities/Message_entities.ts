import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('message_entities')
export class MessageEntities {
  @PrimaryGeneratedColumn({ default: 'nextval(message_entities_message_entity_id_seq)' })
  message_entity_id: number;

  @Column({ length: 50 })
  entity_name: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}