import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('products')
export class Products {
  @PrimaryGeneratedColumn({ default: 'nextval(products_product_id_seq)' })
  product_id: number;

  @PrimaryGeneratedColumn()
  item_id: number;

  @Column({ nullable: true })
  weight: number;

  @Column({ nullable: true, length: 50 })
  dimensions: string;

  @Column({ nullable: true, length: 255 })
  manufacturer: string;

  @PrimaryGeneratedColumn({ nullable: true })
  product_group_id: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}