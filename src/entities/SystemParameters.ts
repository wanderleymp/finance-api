import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('system_parameters')
export class SystemParameters {
  @Column({ nullable: false, primary: true })
  parameter_id: number;

  @Column({ nullable: false })
  value: string;

  @Column()
  effective_date: Date;

  @Column()
  expiry_date: Date;

  @Column({ nullable: false, length: 50 })
  category: string;

  @Column({ length: 50 })
  subcategory: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
