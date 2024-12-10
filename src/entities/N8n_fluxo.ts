import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('n8n_fluxo')
export class N8nFluxo {
  @PrimaryGeneratedColumn()
  id: bigint;

  @Column({ nullable: true })
  message: string;

  @PrimaryGeneratedColumn({ nullable: true })
  convid: string;

  @Column({ nullable: true })
  created_at: string;

  @UpdateDateColumn()
  updatedAt: Date;
}