import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('service_groups')
export class ServiceGroups {
  @Column({ nullable: false, primary: true })
  service_group_id: number;

  @Column()
  account_entry_id: number;

  @Column()
  created_at: string;

  @Column()
  updated_at: string;

  @Column()
  service_municipality_id: number;

  @Column({ nullable: false, length: 255 })
  group_name: string;

  @Column()
  group_description: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
