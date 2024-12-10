import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('person_cnae')
export class PersonCnae {
  @PrimaryGeneratedColumn()
  person_id: number;

  @PrimaryGeneratedColumn()
  cnae_id: number;

  @Column({ default: false })
  is_primary: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}