import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('pix_key_types')
export class PixKeyTypes {
  @Column({ nullable: false, primary: true })
  pix_key_type_id: number;

  @Column({ nullable: false, length: 50 })
  description: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
