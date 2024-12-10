import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('message_directions')
export class MessageDirections {
  @PrimaryGeneratedColumn({ default: 'nextval(message_directions_direction_id_seq)' })
  direction_id: number;

  @Column({ length: 20 })
  direction_name: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}