import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('account_movement_errors')
export class AccountMovementErrors {
  @Column({ nullable: false, primary: true })
  error_id: number;

  @Column({ nullable: false })
  reference_id: number;

  @Column()
  parameters: any;

  @Column()
  created_at: string;

  @Column({ nullable: false, length: 100 })
  origin: string;

  @Column({ nullable: false, length: 100 })
  operation: string;

  @Column()
  error_message: string;

  @Column({ length: 20 })
  status: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
