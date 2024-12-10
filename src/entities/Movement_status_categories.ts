import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('movement_status_categories')
export class MovementStatusCategories {
  @PrimaryGeneratedColumn({ default: 'nextval(movement_status_categories_status_category_id_seq)' })
  status_category_id: number;

  @Column({ length: 50 })
  category_name: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}