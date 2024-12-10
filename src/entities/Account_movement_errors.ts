import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('account_movement_errors')
export class AccountMovementErrors {
  @PrimaryGeneratedColumn({ default: 'nextval(account_movement_errors_error_id_seq)' })
  error_id: number;

  @Column({ length: 100 })
  origin: string;

  @Column({ length: 100 })
  operation: string;

  @PrimaryGeneratedColumn()
  reference_id: number;

  @Column({ nullable: true })
  parameters: any;

  @Column({ nullable: true })
  error_message: string;

  @Column({ nullable: true, length: 20, default: 'pending' })
  status: string;

  @Column({ nullable: true, default: new Date() })
  created_at: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}