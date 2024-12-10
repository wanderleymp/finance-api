import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('cnae')
export class Cnae {
  @PrimaryGeneratedColumn({ default: 'nextval(cnae_cnae_id_seq)' })
  cnae_id: number;

  @Column({ length: 20 })
  code: string;

  @Column({ length: 255 })
  description: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}