import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('credit_cards')
export class CreditCards {
  @Column({ nullable: false, primary: true })
  credit_card_id: number;

  @Column({ nullable: false })
  account_id: number;

  @Column({ nullable: false })
  credit_limit: string;

  @Column({ nullable: false })
  closing_date: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
