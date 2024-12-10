import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('service_lc116')
export class ServiceLc116 {
  @Column({ nullable: false, primary: true })
  service_lc116_id: number;

  @Column({ nullable: false, length: 10 })
  code: string;

  @Column({ nullable: false })
  description: string;

  @Column({ length: 10 })
  cnae: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
