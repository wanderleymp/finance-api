import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('vw_movements')
export class VwMovements {
  @Column()
  movement_id: number;

  @Column()
  movement_date: Date;

  @Column()
  movement_status_id: number;

  @Column()
  movement_type_id: number;

  @Column()
  total_amount: string;

  @Column()
  person_id: number;

  @Column()
  installments_json: any;

  @Column()
  boletos_json: any;

  @Column()
  invoices_json: any;

  @Column({ length: 255 })
  full_name: string;

  @Column({ length: 50 })
  type_name: string;

  @Column({ length: 50 })
  status_name: string;

  @Column()
  description: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
