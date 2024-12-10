import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('pix_key_types')
export class PixKeyTypes {
  @PrimaryGeneratedColumn({ default: 'nextval(pix_key_types_pix_key_type_id_seq)' })
  pix_key_type_id: number;

  @Column({ length: 50 })
  description: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}