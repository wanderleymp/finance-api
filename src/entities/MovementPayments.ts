import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('movement_payments')
export class MovementPayments {
  @Column({ nullable: false, primary: true })
  payment_id: number;

  @Column({ nullable: false })
  movement_id: number;

  @Column({ nullable: false })
  payment_method_id: number;

  @Column({ nullable: false })
  total_amount: string;

  @Column({ length: 20 })
  status: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
