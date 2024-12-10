import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('person_pix_keys')
export class PersonPixKeys {
  @Column({ nullable: false, primary: true })
  pix_key_id: number;

  @Column({ nullable: false })
  person_id: number;

  @Column({ nullable: false })
  pix_key_type_id: number;

  @Column()
  is_preferred: boolean;

  @Column()
  created_at: string;

  @Column({ nullable: false, length: 255 })
  pix_key_value: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
