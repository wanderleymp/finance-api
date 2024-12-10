import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('cte')
export class Cte {
  @PrimaryGeneratedColumn({ default: 'nextval(cte_cte_id_seq)' })
  cte_id: number;

  @PrimaryGeneratedColumn()
  invoice_id: number;

  @Column({ nullable: true, length: 44 })
  access_key: string;

  @Column({ nullable: true, length: 50 })
  freight_mode: string;

  @PrimaryGeneratedColumn({ nullable: true })
  sender_person_id: number;

  @PrimaryGeneratedColumn({ nullable: true })
  receiver_person_id: number;

  @Column({ nullable: true })
  freight_value: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}