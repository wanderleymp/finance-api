import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('message_entities')
export class MessageEntities {
  @Column({ nullable: false, primary: true })
  message_entity_id: number;

  @Column({ nullable: false, length: 50 })
  entity_name: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
