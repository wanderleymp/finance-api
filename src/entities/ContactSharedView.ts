import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('contact_shared_view')
export class ContactSharedView {
  @Column()
  contact_id: number;

  @Column()
  busines: any;

  @Column({ length: 100 })
  contact_value: string;

  @Column({ length: 150 })
  contact_name: string;

  @Column({ length: 50 })
  contact_type_name: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
