import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('vw_movement_template')
export class VwMovementTemplate {
  @Column()
  first_due_date_days: number;

  @Column()
  template_id: number;

  @Column()
  person_id: number;

  @Column()
  license_id: number;

  @Column()
  payment_method_id: number;

  @Column()
  total_value: string;

  @Column()
  created_at: string;

  @Column()
  updated_at: string;

  @Column()
  generate_nfse: boolean;

  @Column()
  generate_boleto: boolean;

  @Column()
  default_discount: string;

  @Column()
  default_addition: string;

  @Column()
  active: boolean;

  @Column()
  service_id: number;

  @Column({ length: 255 })
  full_name: string;

  @Column({ length: 255 })
  name: string;

  @Column({ length: 50 })
  method_name: string;

  @Column({ length: 255 })
  template_name: string;

  @Column({ length: 50 })
  movement_type: string;

  @Column()
  description: string;

  @Column({ length: 100 })
  license_name: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
