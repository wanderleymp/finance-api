import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('person_license')
export class PersonLicense {
  @Column({ nullable: false })
  license_id: number;

  @Column({ nullable: false })
  person_id: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
