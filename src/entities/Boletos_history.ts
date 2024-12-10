import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('boletos_history')
export class BoletosHistory {
  @PrimaryGeneratedColumn()
  boleto_history_id: number;

  @PrimaryGeneratedColumn()
  boleto_id: number;

  @Column({ length: 20 })
  status: string;

  @Column({ nullable: true })
  status_details: string;

  @Column({ nullable: true, default: new Date() })
  changed_at: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}