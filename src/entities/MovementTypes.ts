import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('movement_types')
export class MovementTypes {
  @Column({ nullable: false, primary: true })
  movement_type_id: number;

  @Column({ nullable: false, length: 50 })
  type_name: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
