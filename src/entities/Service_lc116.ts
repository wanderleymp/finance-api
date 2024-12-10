import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('service_lc116')
export class ServiceLc116 {
  @PrimaryGeneratedColumn({ default: 'nextval(service_lc116_id_seq)' })
  service_lc116_id: number;

  @Column({ length: 10 })
  code: string;

  @Column()
  description: string;

  @Column({ nullable: true, length: 10 })
  cnae: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}