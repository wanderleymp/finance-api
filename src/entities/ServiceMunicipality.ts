import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('service_municipality')
export class ServiceMunicipality {
  @Column({ nullable: false, primary: true })
  service_municipality_id: number;

  @Column()
  service_lc116_id: number;

  @Column()
  created_at: string;

  @Column()
  updated_at: string;

  @Column({ nullable: false, length: 20 })
  ctribmun: string;

  @Column({ nullable: false, length: 255 })
  municipality_name: string;

  @Column({ length: 20 })
  ibge_code: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
