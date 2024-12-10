import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('person_qsa')
export class PersonQsa {
  @PrimaryGeneratedColumn()
  juridical_person_id: number;

  @PrimaryGeneratedColumn()
  physical_person_id: number;

  @Column({ nullable: true, default: 'NULL' })
  participation: number;

  @Column({ default: false })
  administrator: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}