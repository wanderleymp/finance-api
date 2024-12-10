import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('credit_cards')
export class CreditCards {
  @PrimaryGeneratedColumn({ default: 'nextval(credit_cards_credit_card_id_seq)' })
  credit_card_id: number;

  @PrimaryGeneratedColumn()
  account_id: number;

  @Column()
  credit_limit: number;

  @Column()
  closing_date: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}