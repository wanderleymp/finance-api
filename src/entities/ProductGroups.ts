import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('product_groups')
export class ProductGroups {
  @Column({ nullable: false, primary: true })
  product_group_id: number;

  @Column()
  created_at: string;

  @Column()
  updated_at: string;

  @Column({ nullable: false, length: 255 })
  name: string;

  @Column()
  description: string;

  @Column({ length: 10 })
  ncm: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
