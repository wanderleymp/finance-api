import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('vw_services_details')
export class VwServicesDetails {
  @PrimaryGeneratedColumn({ nullable: true })
  item_id: number;

  @Column({ nullable: true, length: 255 })
  item_name: string;

  @Column({ nullable: true })
  item_description: string;

  @Column({ nullable: true, length: 20 })
  municipality_code: string;

  @Column({ nullable: true, length: 10 })
  lc116_code: string;

  @Column({ nullable: true })
  lc116_description: string;

  @Column({ nullable: true, length: 10 })
  cnae: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}