import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('person_qsa')
export class PersonQsa {
  @Column({ nullable: false, primary: true })
  juridical_person_id: number;

  @Column({ nullable: false, primary: true })
  physical_person_id: number;

  @Column()
  participation: string;

  @Column({ nullable: false })
  administrator: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
