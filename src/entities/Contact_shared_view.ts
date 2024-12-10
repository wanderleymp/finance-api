import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('contact_shared_view')
export class ContactSharedView {
  @PrimaryGeneratedColumn({ nullable: true })
  contact_id: number;

  @Column({ nullable: true, length: 100 })
  contact_value: string;

  @Column({ nullable: true, length: 150 })
  contact_name: string;

  @Column({ nullable: true, length: 50 })
  contact_type_name: string;

  @Column({ nullable: true })
  busines: any;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}