import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('message_directions')
export class MessageDirections {
  @Column({ nullable: false, primary: true })
  direction_id: number;

  @Column({ nullable: false, length: 20 })
  direction_name: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
