import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('items')
export class Items {
  @PrimaryGeneratedColumn({ default: 'nextval(items_item_id_seq)' })
  item_id: number;

  @Column({ length: 50 })
  code: string;

  @Column({ length: 255 })
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column()
  price: number;

  @Column({ nullable: true, default: new Date() })
  created_at: Date;

  @Column({ nullable: true, default: new Date() })
  updated_at: Date;

  @Column({ default: true })
  active: boolean;

  @Column({ nullable: true })
  deleted_at: Date;
}