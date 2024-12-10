import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('system_parameters')
export class SystemParameters {
  @PrimaryGeneratedColumn({ default: 'nextval(system_parameters_parameter_id_seq)' })
  parameter_id: number;

  @Column({ length: 50 })
  category: string;

  @Column({ nullable: true, length: 50 })
  subcategory: string;

  @Column()
  value: number;

  @Column({ nullable: true, default: 'CURRENT_DATE' })
  effective_date: Date;

  @Column({ nullable: true })
  expiry_date: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}