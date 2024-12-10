import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('n8n_fluxo')
export class N8nFluxo {
  @Column({ nullable: false, primary: true })
  id: number;

  @Column()
  created_at: string;

  @Column()
  message: string;

  @Column()
  convid: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
