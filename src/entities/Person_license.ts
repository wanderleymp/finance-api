import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('person_license')
export class PersonLicense {
  @PrimaryGeneratedColumn()
  person_id: number;

  @PrimaryGeneratedColumn()
  license_id: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}