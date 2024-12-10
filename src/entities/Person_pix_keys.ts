import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('person_pix_keys')
export class PersonPixKeys {
  @PrimaryGeneratedColumn({ default: 'nextval(person_pix_keys_pix_key_id_seq)' })
  pix_key_id: number;

  @PrimaryGeneratedColumn()
  person_id: number;

  @Column({ length: 255 })
  pix_key_value: string;

  @PrimaryGeneratedColumn()
  pix_key_type_id: number;

  @Column({ nullable: true, default: false })
  is_preferred: boolean;

  @Column({ nullable: true, default: new Date() })
  created_at: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}