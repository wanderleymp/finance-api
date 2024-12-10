import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('boletos_history')
export class BoletosHistory {
  @Column({ nullable: false, primary: true })
  boleto_history_id: number;

  @Column({ nullable: false })
  boleto_id: number;

  @Column()
  changed_at: string;

  @Column({ nullable: false, length: 20 })
  status: string;

  @Column()
  status_details: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
