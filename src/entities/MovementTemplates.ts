import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('movement_templates')
export class MovementTemplates {
  @Column({ nullable: false, primary: true })
  template_id: number;

  @Column()
  person_id: number;

  @Column({ nullable: false })
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

  @Column({ nullable: false })
  service_id: number;

  @Column()
  movement_date: Date;

  @Column()
  vencimento_date: Date;

  @Column()
  notifica: boolean;

  @Column()
  description: string;

  @Column({ nullable: false, length: 255 })
  template_name: string;

  @Column({ nullable: false, length: 50 })
  movement_type: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
