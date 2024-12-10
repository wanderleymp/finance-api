import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('service_municipality')
export class ServiceMunicipality {
  @PrimaryGeneratedColumn({ default: 'nextval(service_municipality_service_municipality_id_seq)' })
  service_municipality_id: number;

  @Column({ length: 20 })
  ctribmun: string;

  @Column({ length: 255 })
  municipality_name: string;

  @PrimaryGeneratedColumn({ nullable: true })
  service_lc116_id: number;

  @Column({ nullable: true, default: new Date() })
  created_at: Date;

  @Column({ nullable: true, default: new Date() })
  updated_at: Date;

  @Column({ nullable: true, length: 20 })
  ibge_code: string;
}