import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('person_cnae')
export class PersonCnae {
  @Column({ nullable: false, primary: true })
  person_id: number;

  @Column({ nullable: false, primary: true })
  cnae_id: number;

  @Column({ nullable: false })
  is_primary: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
