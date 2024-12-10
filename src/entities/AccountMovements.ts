import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('account_movements')
export class AccountMovements {
  @Column({ nullable: false })
  amount: string;

  @Column()
  movement_date: string;

  @Column()
  reference_id: number;

  @Column({ nullable: false, primary: true })
  account_movement_id: number;

  @Column()
  account_entry_id: number;

  @Column()
  license_id: number;

  @Column({ nullable: false, length: 10 })
  movement_type: string;

  @Column()
  description: string;

  @Column({ length: 50 })
  status: string;

  @Column({ length: 50 })
  reference_type: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
