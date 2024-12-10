import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('holidays_br')
export class HolidaysBr {
  @Column({ nullable: false, primary: true })
  holiday_id: number;

  @Column()
  day: string;

  @Column()
  month: string;

  @Column()
  year: string;

  @Column({ nullable: false })
  name: string;

  @Column()
  description: string;

  @Column({ nullable: false, length: 20 })
  holiday_type: string;

  @Column()
  state_code: string;

  @Column()
  city: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
