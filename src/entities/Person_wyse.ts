import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('person_wyse')
export class PersonWyse {
  @PrimaryGeneratedColumn()
  id: number;

  @PrimaryGeneratedColumn({ nullable: true })
  person_id: number;

  @PrimaryGeneratedColumn()
  wyse_id: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}