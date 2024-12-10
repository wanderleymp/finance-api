import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('holidays_br')
export class HolidaysBr {
  @PrimaryGeneratedColumn()
  holiday_id: number;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  day: number;

  @Column({ nullable: true })
  month: number;

  @Column({ nullable: true })
  year: number;

  @PrimaryGeneratedColumn({ length: 20 })
  holiday_type: string;

  @Column({ nullable: true, length: 2 })
  state_code: string;

  @Column({ nullable: true })
  city: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}