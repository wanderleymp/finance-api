import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('movement_status_categories')
export class MovementStatusCategories {
  @Column({ nullable: false, primary: true })
  status_category_id: number;

  @Column({ nullable: false, length: 50 })
  category_name: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
