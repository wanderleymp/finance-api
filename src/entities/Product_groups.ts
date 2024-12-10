import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('product_groups')
export class ProductGroups {
  @PrimaryGeneratedColumn({ default: 'nextval(product_groups_product_group_id_seq)' })
  product_group_id: number;

  @Column({ length: 255 })
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true, length: 10 })
  ncm: string;

  @Column({ nullable: true, default: new Date() })
  created_at: Date;

  @Column({ nullable: true, default: new Date() })
  updated_at: Date;
}