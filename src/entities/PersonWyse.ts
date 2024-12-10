import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('person_wyse')
export class PersonWyse {
  @Column({ nullable: false, primary: true })
  id: number;

  @Column()
  person_id: number;

  @Column({ nullable: false })
  wyse_id: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
