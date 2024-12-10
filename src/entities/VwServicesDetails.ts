import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('vw_services_details')
export class VwServicesDetails {
  @Column()
  item_id: number;

  @Column({ length: 255 })
  item_name: string;

  @Column()
  item_description: string;

  @Column({ length: 20 })
  municipality_code: string;

  @Column({ length: 10 })
  lc116_code: string;

  @Column()
  lc116_description: string;

  @Column({ length: 10 })
  cnae: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
